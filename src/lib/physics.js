// Rapier, loaded on demand. The ground is a triangle mesh, the scenery is a
// handful of simple solids, and the character is a kinematic capsule moved by
// Rapier's character controller.
const HALF = 0.45, RADIUS = 0.35;
export const FEET = HALF + RADIUS;

export async function createPhysics(ground, obstacles, start) {
  const RAPIER = (await import('@dimforge/rapier3d-compat')).default;
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  world.createCollider(RAPIER.ColliderDesc.trimesh(ground.vertices, ground.indices));
  for (const o of obstacles) {
    let desc;
    if (o.type === 'cyl') desc = RAPIER.ColliderDesc.cylinder(o.h / 2, o.r).setTranslation(o.x, o.y + o.h / 2 - 0.3, o.z);
    else if (o.type === 'ball') desc = RAPIER.ColliderDesc.ball(o.r).setTranslation(o.x, o.y, o.z);
    else desc = RAPIER.ColliderDesc.cuboid(o.hx, o.hy, o.hz).setTranslation(o.x, o.y + o.hy - 0.3, o.z)
      .setRotation({ x: 0, y: Math.sin(o.rot / 2), z: 0, w: Math.cos(o.rot / 2) });
    world.createCollider(desc);
  }

  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(start.x, start.y + FEET + 0.05, start.z));
  const collider = world.createCollider(RAPIER.ColliderDesc.capsule(HALF, RADIUS), body);
  const controller = world.createCharacterController(0.03);
  controller.enableAutostep(0.45, 0.2, true);
  controller.enableSnapToGround(0.45);
  controller.setMaxSlopeClimbAngle((62 * Math.PI) / 180);
  controller.setMinSlopeSlideAngle((72 * Math.PI) / 180);
  world.step();

  return {
    // Moves the capsule by the wanted amount, sliding along whatever is in the way.
    move(dx, dy, dz, dt) {
      controller.computeColliderMovement(collider, { x: dx, y: dy, z: dz });
      const m = controller.computedMovement();
      const t = body.translation();
      const next = { x: t.x + m.x, y: t.y + m.y, z: t.z + m.z };
      body.setNextKinematicTranslation(next);
      world.timestep = dt;
      world.step();
      return { x: next.x, y: next.y - FEET, z: next.z, grounded: controller.computedGrounded() };
    },
    place(x, y, z) {
      body.setTranslation({ x, y: y + FEET + 0.05, z }, true);
      world.step();
    },
  };
}
