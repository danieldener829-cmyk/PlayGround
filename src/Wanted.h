#pragma once

namespace samp3d {

// Sistema de procurado estilo GTA/SAMP (0..5 estrelas)
class WantedSystem {
public:
    int stars = 0;
    float heat = 0; // 0..100, sobe com crimes, cai com o tempo escondido

    void addCrime(float amount) {
        heat += amount;
        if (heat > 100) heat = 100;
        refresh();
    }

    void update(float dt, bool committingCrime, bool inPoliceSight) {
        if (committingCrime) heat += dt * 8.0f;
        else if (!inPoliceSight) heat -= dt * (stars >= 3 ? 1.5f : 4.0f);
        if (heat < 0) heat = 0;
        if (heat > 100) heat = 100;
        refresh();
    }

    void bribe() { // estrela some pagando propina / pickup
        if (stars > 0) { stars--; heat = stars * 18.0f; }
    }
    void busted() { stars = 0; heat = 0; }

private:
    void refresh() {
        if (heat < 8) stars = 0;
        else if (heat < 25) stars = 1;
        else if (heat < 45) stars = 2;
        else if (heat < 65) stars = 3;
        else if (heat < 85) stars = 4;
        else stars = 5;
    }
};

} // namespace samp3d
