import Link from 'next/link';
import { Scale } from 'lucide-react'; // Using Scale as a thematic icon

export function LawLensHeader() {
  return (
    <header className="py-4 px-4 md:px-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <div className="container mx-auto flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition-colors">
          <Scale className="h-7 w-7 md:h-8 md:w-8" />
          <h1 className="text-2xl md:text-3xl font-headline font-bold">LawLens</h1>
        </Link>
      </div>
    </header>
  );
}
