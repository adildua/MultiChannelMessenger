import { ReactNode } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: string | number;
  href?: string;
  linkText?: string;
}

export function StatCard({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  value,
  href = "#",
  linkText = "View all"
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <Icon className={`${iconColor} h-5 w-5`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a href={href} className="font-medium text-primary hover:text-primary/80">{linkText}</a>
        </div>
      </CardFooter>
    </Card>
  );
}

export default StatCard;
