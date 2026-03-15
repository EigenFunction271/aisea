"use client"

import * as React from "react"
import { useMemo, useState, useEffect } from "react"
import Image from "next/image"
import { Menu } from "lucide-react"
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createClient } from "@/lib/supabase/client";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { cn } from "@/lib/utils"

const Navbar1 = () => {
  const t = useTranslations('nav');
  const [session, setSession] = useState<{ user: unknown } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const authLink = session ? "/dashboard" : "/login";
  const authLabel = session ? t("dashboard") : t("login");

  const dropdownItems = useMemo(() => [
    { label: t('events'), href: "/events" },
    { label: t('manifesto'), href: "/manifesto" },
  ], [t]);
  
  const navItems = useMemo(() => [
    { label: t('workWithUs'), href: "/work-with-us" },
    { label: t('residency'), href: "/residency" },
  ], [t]);

  return (
    <div className="flex justify-center w-full py-2 px-4 sm:px-6 pt-[max(0.5rem,env(safe-area-inset-top))] fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/5 w-full max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-3rem)] relative z-50 pointer-events-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="w-7 h-7 mr-5 cursor-pointer relative">
              <Image
                src="/icon1.png"
                alt="AI.SEA Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-6">
              {/* Home with dropdown (events, manifesto) */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  asChild
                  className={cn(
                    "bg-transparent border-none px-0 text-sm text-white/70 hover:text-white/90 transition-colors font-medium data-[state=open]:bg-transparent data-[state=open]:text-white/90"
                  )}
                >
                  <Link href="/" className="flex items-center">
                    {t('home')}
                  </Link>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-1 p-2">
                    {dropdownItems.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              "block select-none rounded-sm px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors font-medium"
                            )}
                          >
                            {item.label}
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              {/* Regular Nav Items */}
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        "text-sm text-white/70 hover:text-white/90 transition-colors font-medium"
                      )}
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <Button asChild variant="outline" size="sm" className="rounded-full border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-medium">
            <Link href={authLink}>{authLabel}</Link>
          </Button>
          <LanguageSwitcher />
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-4">
          <LanguageSwitcher />
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center">
                <Menu className="h-5 w-5 text-white/70" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black/95 backdrop-blur-md border-white/10 p-6 pt-14">
              <div className="flex flex-col space-y-6">
                <Link
                  href="/"
                  className="text-base text-white/80 hover:text-white font-medium"
                >
                  {t('home')}
                </Link>
                {dropdownItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base text-white/60 hover:text-white font-medium ml-4"
                  >
                    {item.label}
                  </Link>
                ))}
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base text-white/80 hover:text-white font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={authLink}
                  className="text-base text-white/80 hover:text-white font-medium mt-4 pt-4 border-t border-white/10"
                >
                  {authLabel}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}


export { Navbar1 }