import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Flow } from "@shared/schema";
import { Link } from "wouter";

interface FlowBuilderPreviewProps {
  onCreateFlow: () => void;
}

export function FlowBuilderPreview({ onCreateFlow }: FlowBuilderPreviewProps) {
  const { data: flows, isLoading } = useQuery<Flow[]>({
    queryKey: ['/api/flows/active'],
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium">Active Flows</CardTitle>
        <Button onClick={onCreateFlow}>
          Create Flow
        </Button>
      </CardHeader>
      <CardContent className="border-t border-gray-200 px-4 py-6 h-64 relative bg-gray-50 overflow-hidden">
        {/* Flow Diagram Preview */}
        <div className="absolute inset-0 p-4">
          <svg width="100%" height="100%">
            {/* SMS Node */}
            <g transform="translate(50, 30)">
              <rect className="flow-node" rx="4" ry="4" fill="#EBF5FF" stroke="#3B82F6" strokeWidth="2"></rect>
              <text x="20" y="30" fontSize="14" fill="#1F2937">SMS Campaign</text>
              <text x="20" y="50" fontSize="12" fill="#6B7280">Send welcome message</text>
            </g>
            
            {/* Connector */}
            <path d="M140,80 L140,120" className="flow-connector"></path>
            
            {/* Decision Node */}
            <g transform="translate(50, 130)">
              <rect className="flow-node" rx="4" ry="4" fill="#ECFDF5" stroke="#10B981" strokeWidth="2"></rect>
              <text x="20" y="30" fontSize="14" fill="#1F2937">Decision</text>
              <text x="20" y="50" fontSize="12" fill="#6B7280">Check response</text>
            </g>
            
            {/* Connector Left */}
            <path d="M100,210 L50,240 L50,280" className="flow-connector"></path>
            
            {/* Connector Right */}
            <path d="M180,210 L230,240 L230,280" className="flow-connector"></path>
            
            {/* WhatsApp Node */}
            <g transform="translate(0, 280)">
              <rect className="flow-node" rx="4" ry="4" fill="#F3F4F6" stroke="#8B5CF6" strokeWidth="2"></rect>
              <text x="20" y="30" fontSize="14" fill="#1F2937">WhatsApp</text>
              <text x="20" y="50" fontSize="12" fill="#6B7280">Send rich media</text>
            </g>
            
            {/* VOIP Node */}
            <g transform="translate(190, 280)">
              <rect className="flow-node" rx="4" ry="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"></rect>
              <text x="20" y="30" fontSize="14" fill="#1F2937">VOIP Call</text>
              <text x="20" y="50" fontSize="12" fill="#6B7280">Automated call</text>
            </g>
          </svg>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-200">
        <Link href="/flow-builder" className="text-sm font-medium text-primary hover:text-primary/80">
          View all flows
        </Link>
      </CardFooter>
    </Card>
  );
}

export default FlowBuilderPreview;
