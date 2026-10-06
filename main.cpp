// SAMP 3D — núcleo C++ estilo GTA San Andreas (Phone/Tablet via NDK/iOS + Web via WASM/JS mirror)
// Compila sem dependencias externas: logica pura (mundo, jogador, veiculos, procurado).
// Render: no Android/iOS/Desktop plugue Raylib ou bgfx (ver android_raylib_example.cpp).
// Na Web este mesmo modelo e espelhado em game.js (Three.js) para jogar no celular agora.

#include "src/Vec3.h"
#include "src/World.h"
#include "src/Player.h"
#include "src/Vehicle.h"
#include "src/Wanted.h"

#include <cstdio>
#include <cassert>
#include <cmath>

using namespace samp3d;

static int testsPassed = 0;
static void check(bool cond, const char* name) {
    if (cond) { std::printf("[OK] %s\n", name); testsPassed++; }
    else { std::printf("[FALHOU] %s\n", name); }
}

int main() {
    std::printf("SAMP 3D core — teste de simulacao (C++17, sem GPU)\n");

    World world;
    check(world.buildings().size() > 20, "mundo gera predios");
    check(world.roadXs().size() == 6 && world.roadZs().size() == 6, "ruas 6x6");

    Player p;
    auto s = world.playerSpawn();
    p.spawn(s.pos);
    InputState in;
    in.moveY = 1.0f; // anda pra frente
    for (int i = 0; i < 60; ++i) p.update(1.0f/60.0f, in, world);
    check(p.speed2D > 3.0f, "jogador anda");
    check(Vec3::dist(p.pos, s.pos) > 2.0f, "jogador saiu do spawn");

    // colisao: teleporta pra dentro de um predio e ve se empurra pra fora
    if (!world.buildings().empty()) {
        Player q;
        q.spawn(world.buildings()[0].pos);
        InputState idle;
        q.update(1.0f/60.0f, idle, world);
        check(!world.collidesBuilding(q.pos, 0.1f), "colisao empurra pra fora do predio");
    }

    Vehicle v;
    VehicleConfig cfg; cfg.name = "Sedan"; cfg.maxSpeed = 28;
    v.spawn({world.roadXs()[0], 0, world.roadZs()[0]}, 0, cfg);
    VehicleInput vin; vin.throttle = 1.0f;
    for (int i = 0; i < 120; ++i) v.update(1.0f/60.0f, vin, world);
    check(v.speed > 10.0f, "carro acelera");
    check(Vec3::dist(v.pos, {world.roadXs()[0],0,world.roadZs()[0]}) > 5.0f, "carro se move");

    WantedSystem w;
    check(w.stars == 0, "comeca sem procurado");
    w.addCrime(30); check(w.stars == 2, "crime gera 2 estrelas");
    for (int i = 0; i < 600; ++i) w.update(1.0f/60.0f, false, false);
    check(w.stars < 2, "escondido esfria o procurado");

    p.damage(30); check(p.health == 70, "dano sem colete");
    p.armor = 50; p.damage(30); check(p.armor == 20 && p.health == 70, "colete absorve");

    std::vector<Vehicle> fleet;
    TrafficSystem traffic;
    traffic.sync(world, fleet);
    check(fleet.size() >= 5, "transito cria carros");
    for (int i = 0; i < 60; ++i) traffic.update(1.0f/60.0f, world, fleet);
    check(true, "transito atualiza sem crash");

    std::printf("\n%d testes passaram. Nucleo pronto p/ Android NDK (C++17) + iOS + Web.\n", testsPassed);
    std::printf("Para jogar no celular AGORA, abra o index.html (Three.js espelha este modelo).\n");
    return 0;
}
