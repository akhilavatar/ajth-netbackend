export const applyMorphTarget = (node, targetName, value) => {
  if (!node?.morphTargetDictionary) return;
  
  const idx = node.morphTargetDictionary[targetName];
  if (typeof idx !== 'undefined') {
    node.morphTargetInfluences[idx] = value;
  }
};