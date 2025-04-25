import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Sample data - would be fetched from API in a real app
const data = [
  {
    name: 'Spring Sale',
    delivered: 9000,
    opened: 4000,
    responded: 2400,
  },
  {
    name: 'New Product',
    delivered: 8000,
    opened: 3000,
    responded: 1400,
  },
  {
    name: 'Customer Survey',
    delivered: 7000,
    opened: 3500,
    responded: 1800,
  },
  {
    name: 'Weekly Newsletter',
    delivered: 10000,
    opened: 5000,
    responded: 2000,
  },
  {
    name: 'Event Invitation',
    delivered: 6000,
    opened: 3000,
    responded: 1500,
  },
];

export function CampaignStats() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="delivered" fill="#8884d8" />
        <Bar dataKey="opened" fill="#82ca9d" />
        <Bar dataKey="responded" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
}