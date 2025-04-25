import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Sample data - would be fetched from API in a real app
const data = [
  { name: 'Jan', SMS: 4000, WhatsApp: 2400, VOIP: 1200, RCS: 800 },
  { name: 'Feb', SMS: 3000, WhatsApp: 2800, VOIP: 1500, RCS: 1000 },
  { name: 'Mar', SMS: 3500, WhatsApp: 3200, VOIP: 1600, RCS: 1200 },
  { name: 'Apr', SMS: 4500, WhatsApp: 3800, VOIP: 1800, RCS: 1500 },
  { name: 'May', SMS: 5000, WhatsApp: 4200, VOIP: 2000, RCS: 1800 },
  { name: 'Jun', SMS: 4800, WhatsApp: 4000, VOIP: 2200, RCS: 2000 },
  { name: 'Jul', SMS: 5500, WhatsApp: 4500, VOIP: 2500, RCS: 2200 },
];

export function ChannelPerformance() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="SMS" 
          stackId="1"
          stroke="#8884d8" 
          fill="#8884d8" 
        />
        <Area 
          type="monotone" 
          dataKey="WhatsApp" 
          stackId="1"
          stroke="#82ca9d" 
          fill="#82ca9d" 
        />
        <Area 
          type="monotone" 
          dataKey="VOIP" 
          stackId="1"
          stroke="#ffc658" 
          fill="#ffc658" 
        />
        <Area 
          type="monotone" 
          dataKey="RCS" 
          stackId="1"
          stroke="#ff8042" 
          fill="#ff8042" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}