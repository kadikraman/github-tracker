import { Text, View, type ViewStyle } from 'react-native';

type IconProps = {
  size?: number;
  color: string;
};

const abs = (style: ViewStyle): ViewStyle => ({ position: 'absolute', ...style });

/** Git branch/PR glyph: two nodes joined by a vertical line and an elbow. */
export function PullRequestIcon({ size = 17, color }: IconProps) {
  const s = size / 24;
  const stroke = Math.max(1.5, 2 * s);
  const node = (x: number, y: number): ViewStyle =>
    abs({
      left: x * s,
      top: y * s,
      width: 6 * s,
      height: 6 * s,
      borderRadius: 3 * s,
      borderWidth: stroke,
      borderColor: color,
    });
  return (
    <View style={{ width: size, height: size }}>
      <View style={node(3, 3)} />
      <View style={node(15, 15)} />
      <View
        style={abs({
          left: 6 * s - stroke / 2,
          top: 9.5 * s,
          width: stroke,
          height: 11.5 * s,
          backgroundColor: color,
        })}
      />
      <View
        style={abs({
          left: 12 * s,
          top: 5 * s,
          width: 7 * s,
          height: 9.5 * s,
          borderTopWidth: stroke,
          borderRightWidth: stroke,
          borderColor: color,
          borderTopRightRadius: 4 * s,
        })}
      />
    </View>
  );
}

/** Issue glyph: circle with a centered dot. */
export function IssueIcon({ size = 17, color }: IconProps) {
  const s = size / 24;
  const stroke = Math.max(1.5, 2 * s);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={abs({
          left: 3 * s,
          top: 3 * s,
          width: 18 * s,
          height: 18 * s,
          borderRadius: 9 * s,
          borderWidth: stroke,
          borderColor: color,
        })}
      />
      <View
        style={abs({
          left: 9.5 * s,
          top: 9.5 * s,
          width: 5 * s,
          height: 5 * s,
          borderRadius: 2.5 * s,
          backgroundColor: color,
        })}
      />
    </View>
  );
}

function EyeShape({ size, color, pupilFilled }: { size: number; color: string; pupilFilled: boolean }) {
  const s = size / 24;
  const stroke = Math.max(1.2, 2 * s);
  return (
    <>
      <View
        style={abs({
          left: 2 * s,
          top: 6 * s,
          width: 20 * s,
          height: 12 * s,
          borderRadius: 6 * s,
          borderWidth: stroke,
          borderColor: color,
        })}
      />
      <View
        style={abs({
          left: 9 * s,
          top: 9 * s,
          width: 6 * s,
          height: 6 * s,
          borderRadius: 3 * s,
          borderWidth: pupilFilled ? 0 : stroke,
          borderColor: color,
          backgroundColor: pupilFilled ? color : 'transparent',
        })}
      />
    </>
  );
}

/** Eye with a diagonal slash — the "hide" action. */
export function EyeOffIcon({ size = 16, color }: IconProps) {
  const s = size / 24;
  return (
    <View style={{ width: size, height: size }}>
      <EyeShape size={size} color={color} pupilFilled={false} />
      <View
        style={abs({
          left: 11 * s,
          top: -3 * s,
          width: Math.max(1.2, 2 * s),
          height: 30 * s,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        })}
      />
    </View>
  );
}

/** Open eye — the "unhide" action. */
export function EyeIcon({ size = 14, color }: IconProps) {
  return (
    <View style={{ width: size, height: size }}>
      <EyeShape size={size} color={color} pupilFilled />
    </View>
  );
}

/** Right-pointing chevron; rotate the wrapper for expanded state. */
export function ChevronIcon({ size = 13, color }: IconProps) {
  const arm = size * 0.42;
  const stroke = Math.max(1.5, size * 0.14);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: arm,
          height: arm,
          borderTopWidth: stroke,
          borderRightWidth: stroke,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateX: -arm * 0.2 }],
        }}
      />
    </View>
  );
}

/** Clockwise circle arrow — text glyph, renders monochrome on macOS. The
    glyph carries built-in padding, so it's drawn oversized to line up with
    the other icons. */
export function RefreshIcon({ size = 16, color }: IconProps) {
  const glyphSize = Math.round(size * 1.75);
  return (
    <View style={{ width: size + 4, height: size + 4, alignItems: 'center', justifyContent: 'center' }}>
      <Text
        style={{
          fontSize: glyphSize,
          lineHeight: glyphSize,
          color,
          fontWeight: '600',
          textAlign: 'center',
          transform: [{ translateY: -size * 0.16 }, { translateX: -size * 0.03 }],
        }}
      >
        ⟳
      </Text>
    </View>
  );
}

/** Sun: center disc with eight rays. */
export function SunIcon({ size = 15, color }: IconProps) {
  const disc = size * 0.36;
  const rayLength = size * 0.24;
  const rayWidth = Math.max(1.4, size * 0.1);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          borderWidth: Math.max(1.4, size * 0.12),
          borderColor: color,
        }}
      />
      {Array.from({ length: 8 }, (_, i) => (
        <View
          key={i}
          style={abs({
            left: size / 2 - rayWidth / 2,
            top: size / 2 - rayLength / 2,
            width: rayWidth,
            height: rayLength,
            borderRadius: rayWidth / 2,
            backgroundColor: color,
            transform: [{ rotate: `${i * 45}deg` }, { translateY: -size * 0.4 }],
          })}
        />
      ))}
    </View>
  );
}

/** Crescent moon — text glyph, renders monochrome on macOS. */
export function MoonIcon({ size = 15, color }: IconProps) {
  return (
    <Text style={{ fontSize: size, lineHeight: size + 2, color, fontWeight: '600' }}>☾</Text>
  );
}

/** Monitor with stand — the "follow system" theme option. */
export function MonitorIcon({ size = 15, color }: IconProps) {
  const s = size / 24;
  const stroke = Math.max(1.4, 2 * s);
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={abs({
          left: 3 * s,
          top: 4 * s,
          width: 18 * s,
          height: 12 * s,
          borderRadius: 2 * s,
          borderWidth: stroke,
          borderColor: color,
        })}
      />
      <View
        style={abs({
          left: 12 * s - stroke / 2,
          top: 16 * s,
          width: stroke,
          height: 4 * s,
          backgroundColor: color,
        })}
      />
      <View
        style={abs({
          left: 8 * s,
          top: 20 * s - stroke / 2,
          width: 8 * s,
          height: stroke,
          borderRadius: stroke / 2,
          backgroundColor: color,
        })}
      />
    </View>
  );
}

/** At-sign for the Mentioned section — text glyph matches stroke icons well. */
export function AtSignIcon({ size = 17, color }: IconProps) {
  return (
    <Text style={{ fontSize: size * 0.92, lineHeight: size + 1, color, fontWeight: '700' }}>@</Text>
  );
}

/** Two-row sliders glyph for Settings. */
export function SlidersIcon({ size = 16, color }: IconProps) {
  const s = size / 24;
  const stroke = Math.max(1.5, 1.9 * s);
  const knob = (x: number, y: number): ViewStyle =>
    abs({
      left: x * s,
      top: y * s,
      width: 6 * s,
      height: 6 * s,
      borderRadius: 3 * s,
      borderWidth: stroke,
      borderColor: color,
    });
  const line = (x1: number, x2: number, y: number): ViewStyle =>
    abs({
      left: x1 * s,
      top: y * s - stroke / 2,
      width: (x2 - x1) * s,
      height: stroke,
      backgroundColor: color,
    });
  return (
    <View style={{ width: size, height: size }}>
      <View style={line(3, 13, 7)} />
      <View style={knob(14, 4)} />
      <View style={line(11, 21, 17)} />
      <View style={knob(4, 14)} />
    </View>
  );
}
