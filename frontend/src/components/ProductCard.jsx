
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

function ProductCard({ nombre, descripcion, precio, imagen, categoria }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition duration-300 bg-white">
      <div className="h-56 bg-[#F5F1FA] overflow-hidden">
        <img
          src={imagen || "https://placehold.co/400x300?text=BookStore"}
          alt={nombre}
          className="w-full h-full object-cover hover:scale-105 transition duration-300"
        />
      </div>

      <CardContent className="p-5">
        <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {categoria}
        </span>

        <h2 className="text-lg font-bold text-[#39246D] mb-2">
          {nombre}
        </h2>

        <p className="text-gray-600 text-sm line-clamp-3">
          {descripcion}
        </p>

        <p className="text-2xl font-bold text-[#7655B5] mt-4">
          S/ {Number(precio).toFixed(2)}
        </p>
      </CardContent>

      <CardFooter className="px-5 pb-5">
        <Button className="w-full bg-[#39246D] hover:bg-[#7655B5]">
          Ver libro
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProductCard;
