// Exemplo de como plugar o nucleo SAMP 3D no Raylib (Android/iOS/Desktop 3D real).
// Requer: raylib instalado (https://www.raylib.com/).
// Compilar desktop: g++ android_raylib_example.cpp -o samp3d-raylib -lraylib -lGL -lm -lpthread -ldl
// Android: use raylib template + NDK, chame SampLoop::frame() dentro do loop nativo.
// Este arquivo NAO e compilado pelo CMake padrao (so referencia).

#if 0
#include "raylib.h"
#include "src/World.h"
#include "src/Player.h"
#include "src/Vehicle.h"
#include "src/Wanted.h"
using namespace samp3d;

// ... loop tipico:
// World world; Player player; std::vector<Vehicle> cars;
// InitWindow(800, 450, "SAMP 3D");
// Camera3D cam = {0}; cam.position = {10,10,10}; cam.target = {0,0,0};
// cam.up = {0,1,0}; cam.fovy = 60; cam.projection = CAMERA_PERSPECTIVE;
// while (!WindowShouldClose()) {
//   InputState in{};
//   in.moveY = (IsKeyDown(KEY_W)?1:0) - (IsKeyDown(KEY_S)?1:0);
//   in.moveX = (IsKeyDown(KEY_D)?1:0) - (IsKeyDown(KEY_A)?1:0);
//   in.run = IsKeyDown(KEY_LEFT_SHIFT);
//   player.update(GetFrameTime(), in, world);
//   BeginDrawing(); ClearBackground(SKYBLUE);
//   BeginMode3D(cam);
//   for (auto &b : world.buildings()) DrawCube({b.pos.x,b.pos.y,b.pos.z}, b.w,b.h,b.d, GRAY);
//   EndMode3D(); EndDrawing();
// }
#endif
