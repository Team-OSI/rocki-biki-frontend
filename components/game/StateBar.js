// nickname, hp, 
export default function Component() {
  return (
    <div className="flex items-center gap-4">
      <div className="text-sm font-medium">Health</div>
      <div className="relative w-full h-4 bg-muted rounded-full">
        <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: "75%" }} />
        <div className="absolute left-0 top-0 h-full w-full flex items-center justify-center text-xs text-primary-foreground">
          75%
        </div>
      </div>
    </div>
  )
}