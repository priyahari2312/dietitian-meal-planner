import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/learn/")({
    component: RouteComponent,
});
function RouteComponent() {
  const [x, setX] = useState(0);

  const inc = () => {
    setX(x + 1);
    console.log("show a message here");
  };
   const dec = () => {
    setX(x - 1);
    console.log("show a message here");
  };

  return (
    <div className="p-8">
      <Button onClick={inc}>+</Button>
      <Button onClick={dec}>-</Button> 

      <p>You clicked the button {x} times</p>
      {
        <div>
          {x >= 10 ? <p>You clicked more than 10 times!</p> : <p>Keep clicking!</p>}
        </div>
      }
 </div>
  );
}