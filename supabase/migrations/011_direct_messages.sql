-- ============================================================
-- Direct messaging: investors can message startups that
-- allow it directly; startups can initiate connections with
-- investors; both parties can accept / reject requests.
-- ============================================================

SET search_path TO extensions, public;

-- ── 1. Startup setting ───────────────────────────────────────────────────────
ALTER TABLE public.startup_profiles
  ADD COLUMN IF NOT EXISTS allow_direct_messages BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Add investor_id / startup_id to conversations ─────────────────────────
-- These fields let us identify participants without going through the
-- connections table, and also support direct (connection-less) convos.
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS startup_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ── 3. Back-fill from existing connections ────────────────────────────────────
UPDATE public.conversations cv
SET
  investor_id = c.investor_id,
  startup_id  = c.startup_id
FROM public.connections c
WHERE cv.connection_id = c.id
  AND (cv.investor_id IS NULL OR cv.startup_id IS NULL);

-- ── 4. Make connection_id optional (direct convos have no connection) ─────────
ALTER TABLE public.conversations
  ALTER COLUMN connection_id DROP NOT NULL;

-- ── 5. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS conversations_investor_id_idx ON public.conversations (investor_id);
CREATE INDEX IF NOT EXISTS conversations_startup_id_idx  ON public.conversations (startup_id);

-- Prevent duplicate direct conversations between the same pair
CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_unique
  ON public.conversations (investor_id, startup_id)
  WHERE connection_id IS NULL;

-- ── 6. Connections: allow either party to initiate ───────────────────────────
DROP POLICY IF EXISTS "connections_insert_investor"  ON public.connections;
DROP POLICY IF EXISTS "connections_insert_either"    ON public.connections;

CREATE POLICY "connections_insert_either" ON public.connections FOR INSERT
  WITH CHECK (investor_id = auth.uid() OR startup_id = auth.uid());

-- ── 7. Conversations: SELECT ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;

CREATE POLICY "conversations_select_participants" ON public.conversations FOR SELECT
  USING (investor_id = auth.uid() OR startup_id = auth.uid());

-- ── 8. Conversations: INSERT (direct only; connection-based via trigger) ──────
DROP POLICY IF EXISTS "conversations_insert_direct" ON public.conversations;

CREATE POLICY "conversations_insert_direct" ON public.conversations FOR INSERT
  WITH CHECK (
    investor_id = auth.uid()
    AND connection_id IS NULL
    AND startup_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.startup_profiles sp
      WHERE sp.profile_id = conversations.startup_id
        AND sp.allow_direct_messages = true
    )
  );

-- ── 9. Messages: SELECT ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;

CREATE POLICY "messages_select_participants" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations cv
      WHERE cv.id = messages.conversation_id
        AND (cv.investor_id = auth.uid() OR cv.startup_id = auth.uid())
    )
  );

-- ── 10. Messages: INSERT ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages_insert_participants" ON public.messages;

CREATE POLICY "messages_insert_participants" ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations cv
      WHERE cv.id = conversation_id
        AND (cv.investor_id = auth.uid() OR cv.startup_id = auth.uid())
        AND (
          -- Direct conversation: always can message
          cv.connection_id IS NULL
          OR
          -- Connection-based: connection must be accepted
          EXISTS (
            SELECT 1 FROM public.connections c
            WHERE c.id = cv.connection_id AND c.status = 'accepted'
          )
        )
    )
  );

-- ── 11. Trigger: set investor_id/startup_id when conversation is created ──────
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO public.conversations (connection_id, investor_id, startup_id)
    VALUES (NEW.id, NEW.investor_id, NEW.startup_id)
    ON CONFLICT DO NOTHING;
    UPDATE public.startup_profiles
      SET connections_count = connections_count + 1
      WHERE profile_id = NEW.startup_id;
    UPDATE public.investor_profiles
      SET connections_count = connections_count + 1
      WHERE profile_id = NEW.investor_id;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.startup_id,
      'connection_accepted',
      'Connection accepted!',
      'An investor accepted your connection request.',
      jsonb_build_object('connection_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── 12. Trigger: notify the correct party based on who initiated ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_connection()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initiator UUID;
  v_recipient UUID;
  v_msg       TEXT;
BEGIN
  v_initiator := auth.uid();

  IF v_initiator IS NOT DISTINCT FROM NEW.investor_id THEN
    -- Investor initiated → notify startup
    v_recipient := NEW.startup_id;
    v_msg := 'An investor wants to connect with you.';
  ELSE
    -- Startup initiated → notify investor
    v_recipient := NEW.investor_id;
    v_msg := 'A startup wants to connect with you.';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_recipient,
    'connection_request',
    'New connection request!',
    v_msg,
    jsonb_build_object('connection_id', NEW.id)
  );

  RETURN NEW;
END;
$$;
