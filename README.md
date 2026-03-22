# Babylon Voxel Ship Buoyancy

A Babylon.js proof-of-concept showing a voxel, block-built ship floating on a flat water plane with per-block buoyancy forces, drag, and torque.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Demo Features

- Modular TypeScript structure split by app, scene, ship, water, physics, and HUD
- Block-based ship assembled from voxel layers
- Flat water surface with buoyancy sampled from every voxel block
- Rigid-body style heave, pitch, roll, thrust, and steering response
- Orbit camera and on-screen telemetry for draft, speed, and trim

## Controls

- `W` / `S`: throttle forward or reverse
- `A` / `D`: steer left or right
- `Shift`: temporary engine boost
- `R`: reset the ship pose
- `Mouse drag` / `wheel`: orbit and zoom the camera
