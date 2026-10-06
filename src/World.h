#pragma once
#include "Vec3.h"
#include <string>
#include <vector>

namespace samp3d {

// Cidade estilo Grove Street / San Andreas: grade de ruas + quarteiroes.
struct CityConfig {
    float blockSize = 40.0f;   // tamanho do quarteirao
    float roadWidth = 10.0f;   // largura da rua
    int blocksX = 5;           // quarteiroes em X
    int blocksZ = 5;           // quarteiroes em Z
    float buildingMinH = 8.0f;
    float buildingMaxH = 34.0f;
};

struct Building {
    Vec3 pos;
    float w = 12, h = 16, d = 12;
    int colorIndex = 0;
};

struct SpawnPoint {
    Vec3 pos;
    float heading = 0; // radianos
};

class World {
public:
    explicit World(const CityConfig& cfg = CityConfig{}) : cfg_(cfg) { generate(); }

    void generate() {
        buildings_.clear();
        roadXs_.clear();
        roadZs_.clear();
        float pitch = cfg_.blockSize + cfg_.roadWidth;
        float totalX = pitch * cfg_.blocksX + cfg_.roadWidth;
        float totalZ = pitch * cfg_.blocksZ + cfg_.roadWidth;
        originX_ = -totalX * 0.5f;
        originZ_ = -totalZ * 0.5f;
        sizeX_ = totalX;
        sizeZ_ = totalZ;

        // Posicoes das ruas (centro de cada via)
        for (int i = 0; i <= cfg_.blocksX; ++i)
            roadXs_.push_back(originX_ + cfg_.roadWidth * 0.5f + i * pitch);
        for (int i = 0; i <= cfg_.blocksZ; ++i)
            roadZs_.push_back(originZ_ + cfg_.roadWidth * 0.5f + i * pitch);

        // Predios dentro de cada quarteirao (2x2 por quarteirao, deterministico)
        unsigned seed = 12345;
        auto rnd = [&]() -> float {
            seed = seed * 1664525u + 1013904223u;
            return float(seed % 10000) / 10000.0f;
        };
        for (int bx = 0; bx < cfg_.blocksX; ++bx) {
            for (int bz = 0; bz < cfg_.blocksZ; ++bz) {
                float qx = originX_ + cfg_.roadWidth + bx * pitch;
                float qz = originZ_ + cfg_.roadWidth + bz * pitch;
                // pula 1 quarteirao = praca/parque + 1 = praia no sul
                if (bx == 2 && bz == 2) continue; // praca central
                if (bz == cfg_.blocksZ - 1 && (bx == 1 || bx == 2)) continue; // praia
                for (int ix = 0; ix < 2; ++ix) {
                    for (int iz = 0; iz < 2; ++iz) {
                        float px = qx + cfg_.blockSize * (0.25f + 0.5f * ix);
                        float pz = qz + cfg_.blockSize * (0.25f + 0.5f * iz);
                        float h = cfg_.buildingMinH + rnd() * (cfg_.buildingMaxH - cfg_.buildingMinH);
                        float w = 10 + rnd() * 8;
                        float d = 10 + rnd() * 8;
                        buildings_.push_back({{px, h*0.5f, pz}, w, h, d, int(rnd()*6)});
                    }
                }
            }
        }
    }

    bool isOnRoad(const Vec3& p) const {
        for (float rx : roadXs_)
            if (std::fabs(p.x - rx) < cfg_.roadWidth * 0.5f + 1.0f) return true;
        for (float rz : roadZs_)
            if (std::fabs(p.z - rz) < cfg_.roadWidth * 0.5f + 1.0f) return true;
        return false;
    }

    // Colisao simples AABB contra predios (2D, ignora Y)
    bool collidesBuilding(const Vec3& p, float radius, Vec3* pushOut = nullptr) const {
        for (const auto& b : buildings_) {
            float dx = p.x - b.pos.x;
            float dz = p.z - b.pos.z;
            float ex = b.w * 0.5f + radius;
            float ez = b.d * 0.5f + radius;
            if (std::fabs(dx) < ex && std::fabs(dz) < ez) {
                if (pushOut) {
                    float px = ex - std::fabs(dx);
                    float pz = ez - std::fabs(dz);
                    if (px < pz) pushOut->x = (dx > 0 ? px : -px);
                    else pushOut->z = (dz > 0 ? pz : -pz);
                }
                return true;
            }
        }
        return false;
    }

    Vec3 clampToWorld(const Vec3& p, float margin = 4.0f) const {
        Vec3 r = p;
        r.x = clampf(r.x, originX_ - margin, originX_ + sizeX_ + margin);
        r.z = clampf(r.z, originZ_ - 60.0f, originZ_ + sizeZ_ + margin); // sul = praia/mar
        return r;
    }

    SpawnPoint playerSpawn() const { return {{roadXs_[2], 0, roadZs_[2]}, 0}; }

    const std::vector<Building>& buildings() const { return buildings_; }
    const std::vector<float>& roadXs() const { return roadXs_; }
    const std::vector<float>& roadZs() const { return roadZs_; }
    float sizeX() const { return sizeX_; }
    float sizeZ() const { return sizeZ_; }
    float originX() const { return originX_; }
    float originZ() const { return originZ_; }
    const CityConfig& config() const { return cfg_; }

private:
    CityConfig cfg_;
    std::vector<Building> buildings_;
    std::vector<float> roadXs_, roadZs_;
    float originX_ = 0, originZ_ = 0, sizeX_ = 200, sizeZ_ = 200;
};

} // namespace samp3d
