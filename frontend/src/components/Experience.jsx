import {
  CameraControls,
  ContactShadows,
  Environment,
} from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import { useAvatar } from "../hooks/useAvatar";
import { Avatar } from "./Avatar";
import { Dots } from "./Dots";

export const Experience = () => {
  const { showAvatar } = useAvatar();
  const cameraControls = useRef();

  useEffect(() => {
    if (cameraControls.current) {
      cameraControls.current.setLookAt(0, 1.5, 3, 0, 1.5, 0);
    }
  }, []);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      {showAvatar && (
        <Suspense>
          <Avatar position={[0, 1, 0]} scale={1} />
          <Dots position-y={1.0} position-x={-0.02} />
        </Suspense>
      )}
      <ContactShadows opacity={0.7} scale={10} blur={3.5} />
    </>
  );
};