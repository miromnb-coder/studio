import { SettingsRow } from '@/app/profile/components/SettingsRow';
import type { SettingsSectionData } from '@/app/profile/types';

type SettingsSectionProps = {
  section: SettingsSectionData;
  onPress: (route: string) => void;
};

export function SettingsSection({ section, onPress }: SettingsSectionProps) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[22px] font-semibold tracking-[-0.02em] text-[#4a4a4a]">{section.title}</h2>
      <div className="overflow-hidden rounded-[22px] border border-black/[0.04] bg-white shadow-[0_8px_20px_rgba(17,17,17,0.04)]">
        {section.items.map((item, index) => (
          <SettingsRow key={item.id} item={item} onPress={onPress} isLast={index === section.items.length - 1} />
        ))}
      </div>
    </section>
  );
}
