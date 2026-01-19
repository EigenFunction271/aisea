"use client" 

import * as React from "react"
import Image from "next/image"
import { Menu } from "lucide-react"
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { cn } from "@/lib/utils"

const Navbar1 = () => {
  const t = useTranslations('nav');
  
  const navItems = [
    { label: t('home'), href: "/" },
    { label: t('events'), href: "/events" },
    { label: t('manifesto'), href: "/manifesto" },
    { label: t('workWithUs'), href: "/work-with-us" },
  ];

  return (
    <div className="flex justify-center w-full py-2 px-6 fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between px-8 py-1.5 bg-black/50 backdrop-blur-sm rounded-full border border-white/5 w-full max-w-[calc(100%-3rem)] relative z-50 pointer-events-auto">
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
            <SheetContent side="right" className="bg-black/95 backdrop-blur-md border-white/10">
              <div className="flex flex-col space-y-6 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base text-white/80 hover:text-white font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}


export { Navbar1 }