#pragma once
#include <cmath>

namespace samp3d {

struct Vec3 {
    float x = 0, y = 0, z = 0;
    Vec3() = default;
    Vec3(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}
    Vec3 operator+(const Vec3& o) const { return {x + o.x, y + o.y, z + o.z}; }
    Vec3 operator-(const Vec3& o) const { return {x - o.x, y - o.y, z - o.z}; }
    Vec3 operator*(float s) const { return {x * s, y * s, z * s}; }
    Vec3& operator+=(const Vec3& o) { x += o.x; y += o.y; z += o.z; return *this; }
    float length() const { return std::sqrt(x*x + y*y + z*z); }
    float length2D() const { return std::sqrt(x*x + z*z); }
    Vec3 normalized() const {
        float l = length();
        if (l < 1e-6f) return {0,0,0};
        return {x/l, y/l, z/l};
    }
    static float dist(const Vec3& a, const Vec3& b) { return (a-b).length(); }
    static float dist2D(const Vec3& a, const Vec3& b) {
        float dx = a.x-b.x, dz = a.z-b.z;
        return std::sqrt(dx*dx + dz*dz);
    }
};

inline float clampf(float v, float lo, float hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}
inline float lerpf(float a, float b, float t) { return a + (b-a)*t; }

} // namespace samp3d
