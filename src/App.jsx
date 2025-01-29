import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function App() {
  return (
    <div className="w-screen h-screen">
      <Loader />
      <Leva />
      <UI />
      <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }} className="w-[75%] h-[75%] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Experience />
      </Canvas>
    </div>
  );
}

export default App;