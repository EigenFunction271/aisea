"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[100px] h-8 bg-transparent border-white/10 text-white/70 hover:text-white/90">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-black/95 border-white/10">
        <SelectItem value="en" className="text-white hover:bg-white/10">
          EN
        </SelectItem>
        <SelectItem value="id" className="text-white hover:bg-white/10">
          ID
        </SelectItem>
        <SelectItem value="zh" className="text-white hover:bg-white/10">
          中文
        </SelectItem>
        <SelectItem value="vi" className="text-white hover:bg-white/10">
          VI
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
