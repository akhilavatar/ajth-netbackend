import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useFacialExpressions } from "../hooks/useFacialExpressions";
import { useBlinking } from "../hooks/useBlinking";
import { useLipSync } from "../hooks/useLipSync";
import { filterEndTracks } from "../utils/animations";
import { applyMorphTarget } from "../utils/morphTargets";

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/Netflix.glb");
  const { animations: originalAnimations } = useGLTF("/models/animations.glb");
  const animations = filterEndTracks(originalAnimations);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  const [animation, setAnimation] = useState("Standing Idle");
  const { message, onMessagePlayed } = useChat();
  const { blink } = useBlinking();
  const { currentViseme } = useLipSync();
  
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

  useControls({
    Animation: {
      value: animation,
      options: Object.keys(actions),
      onChange: (value) => {
        setAnimation(value);
      },
    },
  });

  useFrame(() => {
    if (setupMode && nodes?.Wolf3D_Head) {
      Object.entries(setupControls).forEach(([key, value]) => {
        applyMorphTarget(nodes.Wolf3D_Head, key, value);
      });
    }

    // Apply blinking
    if (nodes.Wolf3D_Head) {
      applyMorphTarget(nodes.Wolf3D_Head, 'eyeBlinkLeft', blink ? 1 : 0);
      applyMorphTarget(nodes.Wolf3D_Head, 'eyeBlinkRight', blink ? 1 : 0);
    }

    // Apply lip sync
    if (currentViseme && nodes.Wolf3D_Head) {
      // Reset previous visemes
      Object.keys(nodes.Wolf3D_Head.morphTargetDictionary)
        .filter(key => key.startsWith('viseme_'))
        .forEach(key => {
          applyMorphTarget(nodes.Wolf3D_Head, key, 0);
        });
      
      // Apply current viseme
      applyMorphTarget(nodes.Wolf3D_Head, currentViseme, 1);
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
            geometry={nodes.Wolf3D_Hair.geometry}
            material={materials.Wolf3D_Hair}
            skeleton={nodes.Wolf3D_Hair.skeleton}
          />
          <skinnedMesh
            geometry={nodes.Wolf3D_Body.geometry}
            material={materials.Wolf3D_Body}
            skeleton={nodes.Wolf3D_Body.skeleton}
          />
          <skinnedMesh
            geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
            material={materials.Wolf3D_Outfit_Footwear}
            skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
          />
          <skinnedMesh
            geometry={nodes.Wolf3D_Outfit_Top.geometry}
            material={materials.Wolf3D_Outfit_Top}
            skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
          />
        </group>
      </group>
    </group>
  );
}