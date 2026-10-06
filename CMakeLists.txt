cmake_minimum_required(VERSION 3.16)
project(samp3d CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(samp3d-core main.cpp)
target_include_directories(samp3d-core PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

# Para Android (Phone/Tablet nativo):
#   cmake -B build-android -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
#     -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-24
#   cmake --build build-android
# Para iOS: use ios.toolchain.cmake + -DPLATFORM=OS64
# Para Desktop com Raylib (render 3D real): adicione find_package(raylib) e
#   compile android_raylib_example.cpp (exemplo, requer raylib instalado).
