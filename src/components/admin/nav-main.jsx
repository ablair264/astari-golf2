import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export default function DashboardNavigation({ routes = [] }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const location = useLocation()

  // Determine active route based on current URL
  const getActiveRouteFromPath = () => {
    const path = location.pathname
    const search = location.search
    const fullPath = path + search

    // Check sub-items first (more specific)
    for (const route of routes) {
      if (route.subs) {
        for (const sub of route.subs) {
          if (sub.link === fullPath || sub.link === path) {
            return route.id
          }
        }
      }
    }

    // Find best matching route (most specific first)
    const match = routes.find(route => {
      if (route.link === fullPath) return true
      if (route.link === path) return true
      // Match /admin/products for products route
      if (path.startsWith(route.link) && route.link !== '/admin') return true
      return false
    })

    // Default to home if on /admin exactly, otherwise try to match
    if (path === '/admin' && !search) return 'home'

    return match?.id || routes[0]?.id
  }

  // Track which sub-item is active
  const getActiveSubItem = () => {
    const path = location.pathname
    for (const route of routes) {
      if (route.subs) {
        for (const sub of route.subs) {
          if (sub.link === path) {
            return sub.link
          }
        }
      }
    }
    return null
  }

  const activeSubItem = getActiveSubItem()

  const [activeRoute, setActiveRoute] = useState(getActiveRouteFromPath)

  // Update active route when location changes
  useEffect(() => {
    setActiveRoute(getActiveRouteFromPath())
  }, [location.pathname, location.search])

  return (
    <SidebarGroup>
      <SidebarMenu>
        {routes.map((route) => {
          const hasSubItems = route.subs && route.subs.length > 0
          const isActive = activeRoute === route.id

          if (hasSubItems) {
            return (
              <Collapsible
                key={route.id}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={route.title}
                      className={cn(
                        "w-full",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      onClick={() => setActiveRoute(route.id)}
                    >
                      {route.icon}
                      <span>{route.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {route.subs.map((subItem) => {
                        const isSubActive = activeSubItem === subItem.link
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                isSubActive && "bg-emerald-500/20 text-emerald-300"
                              )}
                            >
                              <a href={subItem.link}>
                                {subItem.icon}
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={route.id}>
              <SidebarMenuButton
                asChild
                tooltip={route.title}
                className={cn(
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => setActiveRoute(route.id)}
              >
                <a href={route.link}>
                  {route.icon}
                  <span>{route.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
