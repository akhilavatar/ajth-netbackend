import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useFacialExpressions } from "../hooks/useFacialExpressions";
import { filterEndTracks } from "../utils/animations";

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/64f1a714fe61576b46f27ca2.glb");
  const { animations: originalAnimations } = useGLTF("/models/animations.glb");
  const animations = filterEndTracks(originalAnimations);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  const [animation, setAnimation] = useState("Standing Idle");
  const { message, onMessagePlayed } = useChat();
  
  const { currentExpression, setupMode, setupControls } = useFacialExpressions(nodes);

  useEffect(() => {
    actions[animation]?.reset().fadeIn(0.5).play();
    return () => {
      actions[animation]?.fadeOut(0.5);
    };
  }, [animation]);

  useEffect(() => {
    if (message) {
      setAnimation("Talking_0");
      const timeout = setTimeout(() => {
        setAnimation("Standing Idle");
        onMessagePlayed();
      }, 2000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [message]);

  // Animation controls
  useControls({
    Animation: {
      value: animation,
      options: Object.keys(actions),
      onChange: (value) => {
        setAnimation(value);
      },
    },
  });

  // Apply setup controls in real-time when in setup mode
  useFrame(() => {
    if (setupMode && nodes?.Wolf3D_Head) {
      Object.entries(setupControls).forEach(([key, value]) => {
        const idx = nodes.Wolf3D_Head.morphTargetDictionary[key];
        if (typeof idx !== 'undefined') {
          nodes.Wolf3D_Head.morphTargetInfluences[idx] = value;
        }
      });
    }
  });

  return (
    <group {...props} ref={group} dispose={null}>
      <group name="Scene">
        <group name="Armature">
          <primitive object={nodes.Hips} />
          <skinnedMesh
            name="EyeLeft"
            geometry={nodes.EyeLeft.geometry}
            material={materials.Wolf3D_Eye}
            skeleton={nodes.EyeLeft.skeleton}
            morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
            morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
          />
          <skinnedMesh
            name="EyeRight"
            geometry={nodes.EyeRight.geometry}
            material={materials.Wolf3D_Eye}
            skeleton={nodes.EyeRight.skeleton}
            morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
            morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
          />
          <skinnedMesh
            name="Wolf3D_Head"
            geometry={nodes.Wolf3D_Head.geometry}
            material={materials.Wolf3D_Skin}
            skeleton={nodes.Wolf3D_Head.skeleton}
            morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
            morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
          />
          <skinnedMesh
            name="Wolf3D_Teeth"
            geometry={nodes.Wolf3D_Teeth.geometry}
            material={materials.Wolf3D_Teeth}
            skeleton={nodes.Wolf3D_Teeth.skeleton}
            morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
            morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
          />
          <skinnedMesh
            name="Wolf3D_Body"
            geometry={nodes.Wolf3D_Body.geometry}
            material={materials.Wolf3D_Body}
            skeleton={nodes.Wolf3D_Body.skeleton}
          />
          <skinnedMesh
            name="Wolf3D_Outfit_Bottom"
            geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
            material={materials.Wolf3D_Outfit_Bottom}
            skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
          />
          <skinnedMesh
            name="Wolf3D_Outfit_Footwear"
            geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
            material={materials.Wolf3D_Outfit_Footwear}
            skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
          />
          <skinnedMesh
            name="Wolf3D_Outfit_Top"
            geometry={nodes.Wolf3D_Outfit_Top.geometry}
            material={materials.Wolf3D_Outfit_Top}
            skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
          />
          <skinnedMesh
            name="Wolf3D_Hair"
            geometry={nodes.Wolf3D_Hair.geometry}
            material={materials.Wolf3D_Hair}
            skeleton={nodes.Wolf3D_Hair.skeleton}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/64f1a714fe61576b46f27ca2.glb");
useGLTF.preload("/models/animations.glb");