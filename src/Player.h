#pragma once
#include "Vec3.h"
#include "World.h"

namespace samp3d {

struct InputState {
    float moveX = 0;   // -1..1 (esquerda/direita)
    float moveY = 0;   // -1..1 (tras/frente) — analogico do joystick
    bool run = false;
    bool jump = false;
    bool action = false; // entrar/sair do carro
    bool shoot = false;
};

class Player {
public:
    Vec3 pos{0, 0, 0};
    Vec3 vel{0, 0, 0};
    float heading = 0;      // direcao que olha
    float speed2D = 0;
    bool onGround = true;
    bool inVehicle = false;
    int health = 100;
    int armor = 0;
    int money = 250;
    float vy = 0;

    static constexpr float WALK_SPEED = 6.0f;
    static constexpr float RUN_SPEED = 10.0f;
    static constexpr float RADIUS = 0.6f;

    void spawn(const Vec3& p) {
        pos = p; vel = {0,0,0}; vy = 0;
        health = 100; inVehicle = false;
    }

    void update(float dt, const InputState& in, const World& world) {
        if (inVehicle) return; // carro move o jogador
        float maxSpeed = in.run ? RUN_SPEED : WALK_SPEED;
        Vec3 wish{in.moveX, 0, in.moveY};
        if (wish.length() > 1.0f) wish = wish.normalized();
        if (wish.length() > 0.01f) {
            float targetHeading = std::atan2(wish.x, wish.z);
            // gira suave
            float diff = targetHeading - heading;
            while (diff > 3.14159f) diff -= 6.28318f;
            while (diff < -3.14159f) diff += 6.28318f;
            heading += diff * clampf(dt * 12.0f, 0.0f, 1.0f);
        }
        Vec3 targetVel = wish * maxSpeed;
        vel.x = lerpf(vel.x, targetVel.x, clampf(dt*10.0f, 0, 1));
        vel.z = lerpf(vel.z, targetVel.z, clampf(dt*10.0f, 0, 1));
        speed2D = vel.length2D();

        // pulo / gravidade simples
        if (onGround && in.jump) { vy = 6.5f; onGround = false; }
        vy -= 20.0f * dt;
        pos.x += vel.x * dt;
        pos.z += vel.z * dt;
        pos.y += vy * dt;
        if (pos.y <= 0) { pos.y = 0; vy = 0; onGround = true; }

        // colisao com predios
        Vec3 push{0,0,0};
        if (world.collidesBuilding(pos, RADIUS, &push)) {
            pos.x += push.x; pos.z += push.z;
        }
        pos = world.clampToWorld(pos);
    }

    void damage(int amount) {
        int rest = amount;
        if (armor > 0) {
            int absorbed = rest < armor ? rest : armor;
            armor -= absorbed; rest -= absorbed;
        }
        health -= rest;
        if (health < 0) health = 0;
    }
    bool isDead() const { return health <= 0; }
    void respawnHospital(const World& w) {
        auto s = w.playerSpawn();
        spawn(s.pos);
        health = 100; armor = 0;
        money = money > 100 ? money - 100 : 0; // taxa hospital
    }
};

} // namespace samp3d
