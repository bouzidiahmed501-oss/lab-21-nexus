import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleStubProps {
  title: string;
  description: string;
  phase: string;
}

export function ModuleStub({ title, description, phase }: ModuleStubProps) {
  return (
    <div className="px-8 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Construction className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">Module en construction</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Ce module sera livré dans la prochaine itération de BALIMS.
          </p>
          <Badge className="mt-4" variant="secondary">{phase}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
