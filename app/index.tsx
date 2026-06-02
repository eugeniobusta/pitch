import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';

// ─── layout constants ────────────────────────────────────────────────────────
const BALL = 44;          // ball diameter
const R    = BALL / 2;   // ball radius
const W    = 260;         // total width of "PITCH" (5 × 52 px)
const LW   = W / 5;      // 52 px per letter

// The ball sits at the bottom of a 110 px tall "launch pad" directly above
// the letters.  Its natural position (tx=0, ty=0) has its centre at:
//   x = W/2 = 130 px from the left edge  (= above letter T)
//   y = 110 - R = 88 px from the top edge (resting on top of the letters)
const PAD_H = 110;

// Horizontal targets (translateX from the T-position / scene centre)
const X0     = -LW * 2; // −104 → above P
const XSTEPS = [-LW, 0, LW, LW * 2]; // I, T, C, H

// Vertical targets (translateY from the resting position)
const PEAK = -(PAD_H - R * 2 + 12); // ≈ −78 → near top of launch pad
const LAND =  0;                     // ball bottom touching letters
const DUR  = 450;                    // ms per single bounce arc

export default function Index() {
  const tx = useRef(new Animated.Value(X0)).current;
  const ty = useRef(new Animated.Value(PEAK)).current;
  const sy = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // One bounce: ball arcs from current position to xTo while falling + rising.
    function bounce(xTo: number) {
      return Animated.parallel([
        // ── x: slide to next letter ─────────────────────────────────────────
        Animated.timing(tx, {
          toValue: xTo,
          duration: DUR,
          useNativeDriver: true,
        }),
        // ── y: fall (ease-in) then rise (ease-out) ───────────────────────────
        Animated.sequence([
          Animated.timing(ty, {
            toValue: LAND,
            duration: DUR * 0.52,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ty, {
            toValue: PEAK,
            duration: DUR * 0.48,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // ── squish on landing ────────────────────────────────────────────────
        Animated.sequence([
          Animated.timing(sy, { toValue: 1,    duration: DUR * 0.46, useNativeDriver: true }),
          Animated.timing(sy, { toValue: 0.58, duration: DUR * 0.09, useNativeDriver: true }),
          Animated.timing(sy, { toValue: 1.14, duration: DUR * 0.12, useNativeDriver: true }),
          Animated.timing(sy, { toValue: 1,    duration: DUR * 0.33, useNativeDriver: true }),
        ]),
      ]);
    }

    const anim = Animated.loop(
      Animated.sequence([
        ...XSTEPS.map(bounce),
        // Instant reset back to P before the next loop iteration
        Animated.parallel([
          Animated.timing(tx, { toValue: X0,   duration: 1, useNativeDriver: true }),
          Animated.timing(ty, { toValue: PEAK, duration: 1, useNativeDriver: true }),
          Animated.timing(sy, { toValue: 1,    duration: 1, useNativeDriver: true }),
        ]),
      ]),
    );

    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={s.root}>
      <View style={s.scene}>
        {/* ── launch pad: ball bounces in here ──────────────────────────── */}
        <View style={s.pad}>
          <Animated.View
            style={[
              s.ball,
              { transform: [{ translateX: tx }, { translateY: ty }, { scaleY: sy }] },
            ]}
          >
            {/* eyes */}
            <View style={s.eyes}>
              <View style={s.eye}><View style={s.pupil} /></View>
              <View style={s.eye}><View style={s.pupil} /></View>
            </View>
            {/* smile — bottom-half of a circle drawn with border trick */}
            <View style={s.smile} />
          </Animated.View>
        </View>

        {/* ── PITCH letters ─────────────────────────────────────────────── */}
        <View style={s.letters}>
          {['P', 'I', 'T', 'C', 'H'].map((l) => (
            <Text key={l} style={s.letter}>{l}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A2E0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scene: {
    alignItems: 'center',
  },

  // ── launch pad ─────────────────────────────────────────────────────────────
  pad: {
    width: W,
    height: PAD_H,
  },
  ball: {
    position: 'absolute',
    bottom: 0,
    left: (W - BALL) / 2,   // = 108 → centres ball above letter T at tx=0
    width: BALL,
    height: BALL,
    borderRadius: R,
    backgroundColor: '#6DB882',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6DB882',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  eyes: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 6,
    marginBottom: 3,
  },
  eye: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1A2E0F',
  },
  // Bottom-half circle = smile
  smile: {
    width: 16,
    height: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2.5,
    borderTopWidth: 0,
    borderColor: '#FFFFFF',
  },

  // ── letters ────────────────────────────────────────────────────────────────
  letters: {
    flexDirection: 'row',
  },
  letter: {
    fontSize: 52,
    fontWeight: '900',
    color: '#2E4820',
    width: LW,
    textAlign: 'center',
    lineHeight: 64,
  },
});
