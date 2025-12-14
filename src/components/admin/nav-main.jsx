import { useState } from "react"
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
  const [activeRoute, setActiveRoute] = useState(routes[0]?.id)

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
                      {route.subs.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.link}>
                              {subItem.icon}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
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
