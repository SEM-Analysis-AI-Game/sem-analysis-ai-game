import * as THREE from 'three';
import { TexturePainter, circleBrush } from './texture-painter';

export function App(): JSX.Element {
  return <TexturePainter initialTool={circleBrush(20.0, new THREE.Color(0xff0000), 1.0)} />;
}
