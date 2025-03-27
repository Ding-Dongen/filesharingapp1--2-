const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Messages",
    href: "/messages",
  },
  {
    title: "Files",
    href: "/files",
  },
]

export function MainNav() {
  return (
    <div className="flex gap-6 md:gap-10">
      {items.map((item) => (
        <a key={item.href} href={item.href} className="text-sm font-medium transition-colors hover:text-foreground/80">
          {item.title}
        </a>
      ))}
    </div>
  )
}

