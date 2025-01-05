import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { useFacialExpressions } from "../hooks/useFacialExpressions";
import { useAudio } from "../hooks/useAudio";
import { useLipSync } from "../hooks/useLipSync";
import { filterEndTracks } from "../utils/animations";

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/64f1a714fe61576b46f27ca2.glb");
  const { animations: originalAnimations } = useGLTF("/models/animations.glb");
  const animations = filterEndTracks(originalAnimations);
  const group = useRef();
  const { actions } = useAnimations(animations, group);
  const [animation, setAnimation] = useState("Standing Idle");
  const { message } = useChat();
  const [blink, setBlink] = useState(false);
  const blinkTimeout = useRef();
  
  const { currentExpression, setupMode, setupControls } = useFacialExpressions(nodes);
  const { currentViseme } = useLipSync();

  useEffect(() => {
    if (!message) {
      setAnimation("Standing Idle");
      return;
    }
    setAnimation(message.animation || "Talking_0");
  }, [message]);

  // Blinking logic...
  useEffect(() => {
    const handleBlink = () => {
      setBlink(true);
      blinkTimeout.current = setTimeout(() => {
        setBlink(false);
        scheduleNextBlink();
      }, 200);
    };

    const scheduleNextBlink = () => {
      const timeout = setTimeout(handleBlink, Math.random() * 5000 + 2000);
      blinkTimeout.current = timeout;
    };

    scheduleNextBlink();

    return () => {
      if (blinkTimeout.current) {
        clearTimeout(blinkTimeout.current);
      }
    };
  }, []);

  // Animation controls...
  useControls({
    Animation: {
      value: animation,
      options: Object.keys(actions),
      onChange: (value) => {
        setAnimation(value);
      },
    },
  });

  useEffect(() => {
    actions[animation]?.reset().fadeIn(0.5).play();
    return () => {
      actions[animation]?.fadeOut(0.5);
    };
  }, [animation]);

  // Apply morphs in real-time
  useFrame(() => {
    if (!nodes?.Wolf3D_Head) return;

    // Reset all morph targets
    nodes.Wolf3D_Head.morphTargetInfluences.fill(0);

    // Apply setup controls
    if (setupMode) {
      Object.entries(setupControls).forEach(([key, value]) => {
        const idx = nodes.Wolf3D_Head.morphTargetDictionary[key];
        if (typeof idx !== 'undefined') {
          nodes.Wolf3D_Head.morphTargetInfluences[idx] = value;
        }
      });
    }

    // Apply blinking
    const blinkIdx = nodes.Wolf3D_Head.morphTargetDictionary.eyeBlinkLeft;
    const blinkRightIdx = nodes.Wolf3D_Head.morphTargetDictionary.eyeBlinkRight;
    if (typeof blinkIdx !== 'undefined' && typeof blinkRightIdx !== 'undefined') {
      nodes.Wolf3D_Head.morphTargetInfluences[blinkIdx] = blink ? 1 : 0;
      nodes.Wolf3D_Head.morphTargetInfluences[blinkRightIdx] = blink ? 1 : 0;
    }

    // Apply lip sync
    if (currentViseme) {
      const visemeIdx = nodes.Wolf3D_Head.morphTargetDictionary[currentViseme];
      if (typeof visemeIdx !== 'undefined') {
        nodes.Wolf3D_Head.morphTargetInfluences[visemeIdx] = 1;
      }
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