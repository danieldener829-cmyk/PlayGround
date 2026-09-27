// jobs.inc - 9 empregos com rota/checkpoints/pagamento/progressao
#if defined _jobs_included
    #endinput
#endif
#define _jobs_included

#include <a_samp>

#define JOB_NONE        0
#define JOB_TRUCKER     1
#define JOB_TAXI        2
#define JOB_BUS         3
#define JOB_DELIVERY    4
#define JOB_MECHANIC    5
#define JOB_FARMER      6
#define JOB_GARBAGE     7
#define JOB_FISHER      8
#define JOB_MINER       9

new const JobNames[][24] = {
    "Desempregado","Caminhoneiro","Taxista","Motorista de Onibus","Entregador",
    "Mecanico","Agricultor","Lixeiro","Pescador","Minerador"
};
// Local de inicio de cada job
new const Float:JobStart[][3] = {
    {0.0,0.0,0.0},
    {655.0,-578.0,16.0},     // trucker LS docks area
    {1744.0,-1868.0,13.0},   // taxi
    {1806.0,-1905.0,13.0},   // bus
    {973.0,-1408.0,13.0},    // delivery
    {1025.0,-1027.0,32.0},   // mechanic
    {-105.0,-1100.0,2.0},    // farmer (Blueberry aprox)
    {2193.0,-1971.0,13.0},   // garbage
    {-1969.0,143.0,27.0},    // fisher (Santa Maria pier)
    {812.0,868.0,12.0}       // miner (Las Barrancas aprox)
};
new const JobVehicle[] = {0, 515, 420, 431, 498, 525, 532, 408, 453, 486};
new const JobPay[] = {0, 320, 180, 220, 160, 200, 150, 170, 190, 240};

// Rota generica: 4 pontos por job (offsets do start p/ nao precisar mapear tudo)
new JobActive[MAX_PLAYERS];      // job id em andamento
new JobStage[MAX_PLAYERS];       // 0..3
new JobVeh[MAX_PLAYERS];         // vehicleid de trabalho

stock Job_Start(playerid, jobid) {
    if (jobid < 1 || jobid > 9) return 0;
    if (JobActive[playerid] != 0) return Notify(playerid, "Termine o servico atual (/parar).", COLOR_RED), 0;
    if (!IsPlayerInRangeOf(JobStart[jobid][0], JobStart[jobid][1], JobStart[jobid][2], playerid, 6.0))
        return Notify(playerid, "Va ao ponto do emprego. Use /gps > Empregos.", COLOR_RED), 0;
    Player[playerid][pJob] = jobid;
    JobActive[playerid] = jobid;
    JobStage[playerid] = 0;
    // cria veiculo de trabalho temporario (nao persistente)
    new Float:x, Float:y, Float:z, Float:a;
    GetPlayerPos(playerid, x, y, z); GetPlayerFacingAngle(playerid, a);
    JobVeh[playerid] = CreateVehicle(JobVehicle[jobid], x+2.0, y, z, a, -1, -1, 60000);
    PutPlayerInVehicle(playerid, JobVeh[playerid], 0);
    Job_NextCheckpoint(playerid);
    new m[64];
    format(m, sizeof(m), "Trabalho iniciado: %s! Siga o checkpoint.", JobNames[jobid]);
    Notify(playerid, m, COLOR_GREEN);
    return 1;
}

stock Job_Stop(playerid) {
    if (JobActive[playerid] == 0) return 0;
    DisablePlayerCheckpoint(playerid);
    if (JobVeh[playerid] != INVALID_VEHICLE_ID) { DestroyVehicle(JobVeh[playerid]); JobVeh[playerid] = INVALID_VEHICLE_ID; }
    JobActive[playerid] = 0; JobStage[playerid] = 0;
    Notify(playerid, "Servico encerrado.");
    return 1;
}

stock Job_NextCheckpoint(playerid) {
    new job = JobActive[playerid];
    new stage = JobStage[playerid];
    // gera destino pseudo-aleatorio mas deterministico por stage (evita decorar mapas externos)
    new Float:bx = JobStart[job][0], Float:by = JobStart[job][1], Float:bz = JobStart[job][2];
    new Float:dx = bx + float((stage * 173 + job * 311) % 800 - 400);
    new Float:dy = by + float((stage * 271 + job * 137) % 800 - 400);
    SetPlayerCheckpoint(playerid, dx, dy, bz, 6.0);
    PVarFloat(playerid, "JobX", dx); PVarFloat(playerid, "JobY", dy);
    return 1;
}

stock Job_OnCheckpoint(playerid) {
    new job = JobActive[playerid];
    if (job == 0) return 0;
    // exige veiculo de trabalho (anti-abuso a pe/teleport)
    if (!IsPlayerInAnyVehicle(playerid) || GetPlayerVehicleID(playerid) != JobVeh[playerid]) {
        Notify(playerid, "Use o veiculo de trabalho!", COLOR_RED);
        Job_NextCheckpoint(playerid); // reenvia
        return 0;
    }
    JobStage[playerid]++;
    if (JobStage[playerid] >= 4) {
        // pagamento com bonus de nivel
        new bonus = Player[playerid][pJobLevel] * 20;
        new pay = JobPay[job] + bonus;
        GivePlayerCash(playerid, pay, "job pay");
        GivePlayerXP(playerid, 15);
        Player[playerid][pJobExp] += 20;
        if (Player[playerid][pJobExp] >= 100) { Player[playerid][pJobExp] = 0; Player[playerid][pJobLevel]++; Notify(playerid, "Nivel de emprego aumentou!", COLOR_YELLOW); }
        new q[160];
        format(q, sizeof(q), "INSERT INTO jobs (char_id,job_id,job_level,job_exp,deliveries) VALUES (%d,%d,%d,%d,1) ON DUPLICATE KEY UPDATE job_level=%d,job_exp=%d,deliveries=deliveries+1",
            Player[playerid][pCharID], job, Player[playerid][pJobLevel], Player[playerid][pJobExp], Player[playerid][pJobLevel], Player[playerid][pJobExp]);
        mysql_tquery(g_SQL, q);
        Job_Stop(playerid);
        Notify(playerid, "Entrega concluida! Pagamento recebido.", COLOR_GREEN);
        SaveCharacter(playerid);
    } else {
        GivePlayerCash(playerid, JobPay[job] / 4, "job etapa");
        Job_NextCheckpoint(playerid);
        Notify(playerid, "Etapa concluida! Proximo ponto marcado.");
    }
    return 1;
}
