import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CircleDot, 
  Trash2, 
  Droplets, 
  Lightbulb, 
  Construction, 
  TreePine,
  Car,
  Building
} from "lucide-react";

const categories = [
  {
    name: "Potholes",
    icon: CircleDot,
    count: "8,420",
    department: "Roads",
  },
  {
    name: "Garbage",
    icon: Trash2,
    count: "12,350",
    department: "Sanitation",
  },
  {
    name: "Water Issues",
    icon: Droplets,
    count: "5,890",
    department: "Water Supply",
  },
  {
    name: "Street Lights",
    icon: Lightbulb,
    count: "4,210",
    department: "Electricity",
  },
  {
    name: "Road Damage",
    icon: Construction,
    count: "3,780",
    department: "PWD",
  },
  {
    name: "Tree Hazards",
    icon: TreePine,
    count: "2,150",
    department: "Gardens",
  },
  {
    name: "Illegal Parking",
    icon: Car,
    count: "6,890",
    department: "Traffic",
  },
  {
    name: "Building Violations",
    icon: Building,
    count: "1,540",
    department: "Building",
  },
];

export function IssueCategories() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Issue Types</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Report Any Civic Issue
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Our AI can identify and categorize a wide range of municipal issues across all departments.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={category.name} className="group hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="size-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <category.icon className="size-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-2xl font-bold text-primary">{category.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{category.department} Dept.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
