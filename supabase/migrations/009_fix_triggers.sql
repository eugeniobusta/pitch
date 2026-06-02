-- All SECURITY DEFINER trigger functions must declare SET search_path = public.
-- Without it, when fired from auth.users the function's search_path does not
-- include the public schema, so table names and custom types are not found —
-- producing "Database error saving new user".

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    (NEW.raw_user_meta_data->>'account_type')::public.account_type
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type = 'startup' THEN
    INSERT INTO public.startup_profiles (profile_id, company_name, tagline, industry, stage)
    VALUES (NEW.id, '', '', 'other'::public.industry_type, 'idea'::public.startup_stage)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF NEW.account_type = 'investor' THEN
    INSERT INTO public.investor_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_pitch_views()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.startup_profiles SET views_count = views_count + 1 WHERE id = NEW.startup_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO public.conversations (connection_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    UPDATE public.startup_profiles SET connections_count = connections_count + 1 WHERE profile_id = NEW.startup_id;
    UPDATE public.investor_profiles SET connections_count = connections_count + 1 WHERE profile_id = NEW.investor_id;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.startup_id,
      'connection_accepted',
      'New connection!',
      'An investor accepted your connection request.',
      jsonb_build_object('connection_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_connection()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.startup_id,
    'connection_request',
    'New connection request!',
    'An investor wants to connect with you.',
    jsonb_build_object('connection_id', NEW.id)
  );
  RETURN NEW;
END;
$$;
