export default function MoreSectionHeader({ title, description }) {
  return (
    <div className="sticky top-0 z-40 bg-gradient-to-b from-card via-card to-card/80 backdrop-blur-sm border-b border-border/30 px-4 py-6 lg:px-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground">More</h1>
      <p className="text-xs lg:text-sm text-muted-foreground mt-1">Admin tools and setup</p>
    </div>
  );
}