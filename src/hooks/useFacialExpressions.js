import { useEffect, useState } from 'react';
import { useControls, folder } from 'leva';
import { facialExpressions } from '../constants/facialExpressions';

export const useFacialExpressions = (nodes) => {
  const [currentExpression, setCurrentExpression] = useState('default');

  const { expression, setupModeEnabled } = useControls({
    'Facial Controls': folder({
      expression: {
        value: 'default',
        options: Object.keys(facialExpressions),
        label: 'Expression'
      },
      setupModeEnabled: {
        value: false,
        label: 'Setup Mode'
      }
    })
  });

  useEffect(() => {
    if (!setupModeEnabled) {
      setCurrentExpression(expression);
    }
  }, [expression, setupModeEnabled]);

  useEffect(() => {
    if (!nodes) return;

    const applyExpressionToMesh = (mesh) => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      // Reset all influences
      mesh.morphTargetInfluences.fill(0);

      // Apply new expression
      const expressionValues = facialExpressions[currentExpression];
      for (const [key, value] of Object.entries(expressionValues)) {
        const idx = mesh.morphTargetDictionary[key];
        if (typeof idx !== 'undefined') {
          mesh.morphTargetInfluences[idx] = value;
        }
      }
    };

    // Apply to all relevant meshes
    ['Wolf3D_Head', 'Wolf3D_Teeth', 'EyeLeft', 'EyeRight'].forEach(meshName => {
      if (nodes[meshName]) {
        applyExpressionToMesh(nodes[meshName]);
      }
    });
  }, [currentExpression, nodes]);

  const morphControls = useControls(
    'Morph Controls',
    setupModeEnabled
      ? Object.fromEntries(
          Object.keys(nodes?.Wolf3D_Head?.morphTargetDictionary || {}).map(key => [
            key,
            {
              value: 0,
              min: 0,
              max: 1,
              step: 0.01,
            },
          ])
        )
      : {},
    { collapsed: true }
  );

  return {
    currentExpression,
    setupMode: setupModeEnabled,
    setupControls: setupModeEnabled ? morphControls : {},
  };
};