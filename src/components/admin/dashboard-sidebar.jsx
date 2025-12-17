import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
  Package2,
  ShoppingBag,
  Tags,
  Users,
  Settings,
  Home,
  Percent,
  Map,
  List,
  MessageCircle,
  Warehouse,
  Image,
} from "lucide-react"
import { Logo } from "./logo"
import DashboardNavigation from "./nav-main"
import { NotificationsPopover } from "./nav-notifications"
import { TeamSwitcher } from "./team-switcher"

const sampleNotifications = [
  {
    id: "1",
    avatar: "/avatars/01.png",
    fallback: "OM",
    text: "New product added.",
    time: "10m ago",
  },
  {
    id: "2",
    avatar: "/avatars/02.png",
    fallback: "JL",
    text: "Brand updated successfully.",
    time: "1h ago",
  },
  {
    id: "3",
    avatar: "/avatars/03.png",
    fallback: "HH",
    text: "New image uploaded.",
    time: "2h ago",
  },
]

export const dashboardRoutes = [
  {
    id: "home",
    title: "Home",
    icon: <Home className="size-4" />,
    link: "/admin",
  },
  {
    id: "products",
    title: "Products",
    icon: <Package2 className="size-4" />,
    subs: [
      {
        title: "Product Manager",
        icon: <Package2 className="size-3" />,
        link: "/admin/products",
      },
      {
        title: "Inventory",
        icon: <Warehouse className="size-3" />,
        link: "/admin/inventory",
      },
      {
        title: "Brands",
        icon: <Tags className="size-3" />,
        link: "/admin/brands",
      },
      {
        title: "Categories",
        icon: <List className="size-3" />,
        link: "/admin/categories",
      },
      {
        title: "Margin Manager",
        icon: <Percent className="size-3" />,
        link: "/admin/margins",
      },
      {
        title: "Image Manager",
        icon: <Image className="size-3" />,
        link: "/admin/images",
      },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    icon: <Users className="size-4" />,
    subs: [
      {
        title: "Customer List",
        icon: <List className="size-3" />,
        link: "/admin/customers",
      },
      {
        title: "Customer Map",
        icon: <Map className="size-3" />,
        link: "/admin/customers/map",
      },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    icon: <ShoppingBag className="size-4" />,
    link: "/admin/orders",
  },
  {
    id: "livechat",
    title: "LiveChat",
    icon: <MessageCircle className="size-4" />,
    link: "/admin/livechat",
  },
  {
    id: "settings",
    title: "Settings",
    icon: <Settings className="size-4" />,
    link: "/admin?tab=settings",
  },
]

const teams = [
  { id: "1", name: "Astari Golf", logo: Logo, plan: "Enterprise" },
]

export function DashboardSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r border-gray-700">
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between"
        )}
      >
        <a href="/admin" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          {!isCollapsed && (
            <span className="font-semibold text-white admin-heading">
              Astari
            </span>
          )}
        </a>

        <motion.div
          key={isCollapsed ? "header-collapsed" : "header-expanded"}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <NotificationsPopover notifications={sampleNotifications} />
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={dashboardRoutes} />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <TeamSwitcher teams={teams} />
      </SidebarFooter>
    </Sidebar>
  )
}
