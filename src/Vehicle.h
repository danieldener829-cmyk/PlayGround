#pragma once
#include "Vec3.h"
#include "World.h"
#include <vector>
#include <string>

namespace samp3d {

struct VehicleConfig {
    std::string name = "Sedan";
    float maxSpeed = 28.0f;
    float accel = 14.0f;
    float brake = 30.0f;
    float turnRate = 2.2f; // rad/s
    int color = 0;
};

struct VehicleInput {
    float throttle = 0; // -1..1
    float steer = 0;    // -1..1
    bool handbrake = false;
};

class Vehicle {
public:
    Vec3 pos{0,0,0};
    float heading = 0;
    float speed = 0; // escalar ao longo do heading
    VehicleConfig cfg;
    bool occupied = false;
    bool destroyed = false;
    int health = 1000;

    void spawn(const Vec3& p, float h, const VehicleConfig& c) {
        pos = p; heading = h; cfg = c;
        speed = 0; occupied = false; destroyed = false; health = 1000;
    }

    void update(float dt, const VehicleInput& in, const World& world) {
        if (destroyed) { speed = lerpf(speed, 0.0f, clampf(dt*4,0,1)); return; }
        float targetMax = cfg.maxSpeed * (in.throttle < 0 ? 0.4f : 1.0f);
        if (in.throttle > 0.05f) {
            speed += cfg.accel * in.throttle * dt;
        } else if (in.throttle < -0.05f) {
            if (speed > 1.0f) speed -= cfg.brake * dt; // freio
            else speed += cfg.accel * 0.5f * in.throttle * dt; // re
        } else {
            speed = lerpf(speed, 0.0f, clampf(dt * (in.handbrake ? 4.0f : 0.8f), 0, 1));
        }
        speed = clampf(speed, -targetMax*0.5f, targetMax);
        if (in.handbrake) speed = lerpf(speed, 0.0f, clampf(dt*3,0,1));
        // esterco depende da velocidade
        float spdF = clampf(std::fabs(speed) / 10.0f, 0.0f, 1.0f);
        float dir = speed >= 0 ? 1.0f : -1.0f;
        heading += in.steer * cfg.turnRate * spdF * dir * dt * -1.0f;

        Vec3 fwd{std::sin(heading), 0, std::cos(heading)};
        Vec3 next = pos + fwd * speed * dt;

        Vec3 push{0,0,0};
        if (world.collidesBuilding(next, 1.6f, &push)) {
            next.x += push.x; next.z += push.z;
            if (std::fabs(speed) > 12.0f) damage(60); // batida forte
            speed *= 0.4f;
        }
        pos = world.clampToWorld(next, 2.0f);
        pos.y = 0;
    }

    void damage(int d) {
        health -= d;
        if (health <= 0) { health = 0; destroyed = true; speed = 0; }
    }
};

// Transito simples: carros seguem retas nas ruas e viram nos cruzamentos.
struct TrafficCar {
    int vehicleIndex = -1;
    int roadAxis = 0; // 0 = anda em Z (rua vertical), 1 = anda em X
    int dir = 1;
    float cruise = 10.0f;
};

class TrafficSystem {
public:
    void sync(const World& world, std::vector<Vehicle>& vehicles) {
        // garante alguns carros de transito
        if (!initialized_) {
            initialized_ = true;
            const auto& xs = world.roadXs();
            const auto& zs = world.roadZs();
            VehicleConfig taxi{"Taxi", 20, 10, 26, 2.0f, 3};
            VehicleConfig sedan{"Sedan", 22, 11, 26, 2.0f, 1};
            for (size_t i = 0; i < 6 && i < xs.size(); ++i) {
                Vehicle v;
                v.spawn({xs[i % xs.size()] + 2.0f, 0, zs[(i*2) % zs.size()]},
                        (i % 2 == 0 ? 0 : 3.14159f),
                        (i % 3 == 0 ? taxi : sedan));
                vehicles.push_back(v);
                TrafficCar t;
                t.vehicleIndex = int(vehicles.size()) - 1;
                t.roadAxis = 0; t.dir = (i % 2 == 0 ? 1 : -1);
                traffic_.push_back(t);
            }
        }
    }

    void update(float dt, const World& world, std::vector<Vehicle>& vehicles) {
        for (auto& t : traffic_) {
            if (t.vehicleIndex < 0 || t.vehicleIndex >= (int)vehicles.size()) continue;
            Vehicle& v = vehicles[t.vehicleIndex];
            if (v.occupied || v.destroyed) continue;
            VehicleInput in;
            in.throttle = 0.6f;
            // mantem faixa: corrige X ou Z em direcao a rua mais proxima
            Vec3 fwd{std::sin(v.heading), 0, std::cos(v.heading)};
            v.update(dt, in, world);
            // vira no fim do mundo
            float m = world.sizeX() * 0.5f - 6;
            if (std::fabs(v.pos.x) > m || std::fabs(v.pos.z) > m)
                v.heading += 3.14159f;
            (void)fwd;
        }
    }

private:
    bool initialized_ = false;
    std::vector<TrafficCar> traffic_;
};

} // namespace samp3d
