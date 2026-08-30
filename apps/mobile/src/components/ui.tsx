import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Design system — glossy / neumorphic surfaces.
 *
 * Every raised control in the app is the same recipe, sampled straight off the
 * mockups: a vertical gradient body, a white gloss fading down from the top
 * edge, a hairline light rim, and a tinted drop shadow. Use `Button` for
 * anything tappable; `Chip` is the small toggle preset.
 */

export const UI = {
  // aqua body, top -> bottom (design/onboarding-design-2.png)
  aquaFrom: '#74D6EC',
  aquaTo: '#0DACC3',
  // white body, top -> bottom
  glassFrom: '#FBFDFF',
  glassTo: '#E5F1FB',
  ink: '#17324A',
  aquaInk: '#12A2BC',
} as const;

export const AQUA_BODY = [UI.aquaFrom, UI.aquaTo] as const;
export const GLASS_BODY = [UI.glassFrom, UI.glassTo] as const;
const GLOSS_AQUA = ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)'] as const;
const GLOSS_GLASS = ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'] as const;

/** Aqua controls throw an aqua shadow, white ones a soft blue-grey. */
export const SHADOW_AQUA = {
  shadowColor: '#0F9CB8',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.34,
  shadowRadius: 12,
  elevation: 5,
} as const;

export const SHADOW_GLASS = {
  shadowColor: '#0A5B96',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.17,
  shadowRadius: 12,
  elevation: 3,
} as const;

type Variant = 'primary' | 'glass';

export function Button({
  label,
  variant = 'primary',
  height = 54,
  radius,
  paddingX = 24,
  textSize = 17,
  arrow,
  check,
  checkSize,
  leading,
  align = 'center',
  textColor,
  textWeight,
  grow,
  disabled,
  onPress,
  style,
}: {
  label: string;
  /** `primary` = aqua body + white text, `glass` = white body + ink text. */
  variant?: Variant;
  height?: number;
  /** Defaults to a full pill. */
  radius?: number;
  paddingX?: number;
  textSize?: number;
  /** Trailing white disc with an aqua glyph (primary CTA). `true` = arrow.right. */
  arrow?: boolean | SymbolViewProps['name'];
  /** Trailing white check disc (selected toggle). */
  check?: boolean;
  /** Check disc diameter. Defaults to 52% of height. */
  checkSize?: number;
  leading?: ReactNode;
  /** `start` left-aligns the label after `leading` (icon + label rows). */
  align?: 'center' | 'start';
  /** Overrides the variant's label colour. */
  textColor?: string;
  /** Overrides the variant's label weight. */
  textWeight?: TextStyle['fontWeight'];
  grow?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  // NativeWind's Pressable interop drops function-form styles, so press state
  // has to come from a plain array — see git history for the layout bug it caused.
  const [down, setDown] = useState(false);
  const aqua = variant === 'primary';
  const r = radius ?? height / 2;
  const disc = Math.round(height * 0.72);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      disabled={disabled}
      style={[
        aqua ? SHADOW_AQUA : SHADOW_GLASS,
        {
          borderRadius: r,
          flexGrow: grow ? 1 : 0,
          flexBasis: grow ? 0 : undefined,
          opacity: disabled ? 0.55 : 1,
        },
        down && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={aqua ? AQUA_BODY : GLASS_BODY}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          height,
          borderRadius: r,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: aqua ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)',
          borderBottomColor: aqua ? 'rgba(255,255,255,0.15)' : '#DDEAF6',
          paddingHorizontal: paddingX,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: align === 'start' ? 'flex-start' : 'center',
          overflow: 'hidden',
        }}
      >
        {/* gloss: light pours in from the top edge and fades by mid-height */}
        <LinearGradient
          colors={aqua ? GLOSS_AQUA : GLOSS_GLASS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: height * (aqua ? 0.25 : 0.6) }}
        />
        {leading}
        {label ? (
          <Text
            style={{
              fontSize: textSize,
              // aqua carries the emphasis; white surfaces stay quiet
              fontWeight: textWeight ?? (aqua ? '600' : '500'),
              color: textColor ?? (aqua ? '#FFFFFF' : UI.ink),
              marginRight: check ? 10 : 0,
            }}
          >
            {label}
          </Text>
        ) : null}
        {check ? (
          <SymbolView name="checkmark.circle.fill" size={checkSize ?? height * 0.52} tintColor="#FFFFFF" />
        ) : null}
        {arrow ? (
          <View
            className="absolute items-center justify-center rounded-full bg-white"
            style={{ right: 6, height: disc, width: disc }}
          >
            <SymbolView
              name={arrow === true ? 'arrow.right' : arrow}
              size={disc * 0.48}
              tintColor={UI.aquaInk}
            />
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

/** Small toggle button — the allergy / gender / time selectors. */
export function Chip({
  label,
  selected,
  check,
  grow,
  onPress,
}: {
  label: string;
  selected?: boolean;
  /** Show the white check disc while selected. */
  check?: boolean;
  grow?: boolean;
  onPress?: () => void;
}) {
  return (
    <Button
      label={label}
      variant={selected ? 'primary' : 'glass'}
      check={selected && check}
      height={44}
      radius={14}
      paddingX={20}
      textSize={14}
      grow={grow}
      onPress={onPress}
    />
  );
}

/** Full-width aqua CTA. */
export function PrimaryButton({
  label,
  arrow,
  disabled,
  onPress,
}: {
  label: string;
  arrow?: boolean | SymbolViewProps['name'];
  disabled?: boolean;
  onPress?: () => void;
}) {
  return <Button label={label} arrow={arrow} disabled={disabled} onPress={onPress} />;
}

/**
 * Profile detail screens — design/profile-detail-screen-design.png.
 *
 * All nine screens in that sheet share one page: a back chevron over a big
 * title and a grey subtitle, then white cards holding rows of
 * "mint icon tile, title, subtitle, trailing control".
 */
export const PAGE = {
  bg: '#EEF5FA',
  card: '#FFFFFF',
  navy: '#0B2E4E',
  sub: '#65809A',
  label: '#7089A0',
  tile: '#DCEEF5',
  icon: '#10A0AE',
  border: '#E4EFF8',
  chevron: '#3E5C7D',
  sep: '#E4EDF5',
} as const;

export const SHADOW_CARD = {
  shadowColor: '#0A5B96',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
} as const;

/** Page padding every detail screen sits on. */
export const PAGE_PAD = 28;

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        className="h-[22px] justify-center"
        style={{ alignSelf: 'flex-start' }}
      >
        <SymbolView name="chevron.left" size={19} weight="semibold" tintColor={PAGE.navy} />
      </Pressable>
      <Text className="mt-[20px] text-[27px] font-bold" style={{ color: PAGE.navy }}>
        {title}
      </Text>
      <Text className="mt-[10px] text-[14.5px]" style={{ color: PAGE.sub }}>
        {subtitle}
      </Text>
    </>
  );
}

/** Bold section heading above a group of cards. */
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text className="text-[15.5px] font-bold" style={{ color: PAGE.navy }}>
        {children}
      </Text>
    </View>
  );
}

export function IconTile({ name }: { name: SymbolViewProps['name'] }) {
  return (
    <View
      className="h-[38px] w-[38px] items-center justify-center rounded-[12px]"
      style={{ backgroundColor: PAGE.tile, borderCurve: 'continuous' }}
    >
      <SymbolView name={name} size={20} weight="medium" tintColor={PAGE.icon} />
    </View>
  );
}

/** Icon tile + title + subtitle + trailing control. `chevron` is the default trailing. */
export function DetailRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: SymbolViewProps['name'];
  title: string;
  subtitle: string;
  /** Defaults to a chevron. Pass a Switch (or anything) to replace it. */
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center px-[17px] py-[19px]"
    >
      <IconTile name={icon} />
      <View className="ml-[18px] flex-1 pr-[10px]">
        <Text className="text-[15.5px] font-bold" style={{ color: PAGE.navy, lineHeight: 20 }}>
          {title}
        </Text>
        <Text className="mt-[5px] text-[13px]" style={{ color: PAGE.sub, lineHeight: 19 }}>
          {subtitle}
        </Text>
      </View>
      <View>
        {trailing ?? (
          <SymbolView name="chevron.right" size={17} weight="semibold" tintColor={PAGE.chevron} />
        )}
      </View>
    </Pressable>
  );
}

/** White rounded surface the rows sit on. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      className="overflow-hidden rounded-[20px]"
      style={[
        {
          backgroundColor: PAGE.card,
          borderWidth: 1,
          borderColor: PAGE.border,
          borderCurve: 'continuous',
        },
        SHADOW_CARD,
        style,
      ]}
    >
      {children}
    </View>
  );
}
