import * as THREE from "three";

export const filterEndTracks = (animations) => {
  return animations.map(clip => {
    const filteredTracks = clip.tracks.filter(track => !track.name.includes('_end'));
    return new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
  });
};