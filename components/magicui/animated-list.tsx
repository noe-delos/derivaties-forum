import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

const notifications: Item[] = [
  {
    id: "1",
    name: "Nouvelle opportunité",
    description: "Stage Goldman Sachs M&A",
    icon: "💼",
    color: "#00C9FF",
    time: "15m",
  },
  {
    id: "2",
    name: "Salaire partagé",
    description: "McKinsey Consultant - 85k€",
    icon: "💰",
    color: "#FFB800",
    time: "10m",
  },
  {
    id: "3",
    name: "Nouveau membre",
    description: "Polytechnique 2024",
    icon: "👤",
    color: "#FF3D71",
    time: "5m",
  },
  {
    id: "4",
    name: "Retour d'expérience",
    description: "Entretien JPMorgan Trading",
    icon: "📝",
    color: "#1BC5BD",
    time: "2m",
  },
];

export function AnimatedList({ className }: { className?: string }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const newItems = [...prev];
        if (newItems.length >= 4) {
          newItems.shift();
        }
        const randomNotification =
          notifications[Math.floor(Math.random() * notifications.length)];
        newItems.push({ ...randomNotification, id: Date.now().toString() });
        return newItems;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex flex-col gap-4 p-6", className)}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.3 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: item.color + "20" }}
            >
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{item.name}</p>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-500">{item.time} ago</span>
              </div>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
