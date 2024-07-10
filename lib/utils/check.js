export function countSceneObjects(scene) {
    const counts = {
        total: 0,
        mesh: 0,
        material: 0,
        texture: 0,
        light: 0,
        camera: 0,
        geometry: 0,
        bone: 0,
        skeleton: 0,
        other: 0
    };
    const maps = {
        materials: new Map(),
        textures: new Map(),
        geometries: new Map()
    };
  
    scene.traverse((object) => {
        counts.total++;
  
        if (object.isMesh) {
            counts.mesh++;
            if (object.geometry) {
                counts.geometry++;
                maps.geometries.set(object.geometry.uuid, object.geometry);
            }
        } else if (object.isLight) {
            counts.light++;
        } else if (object.isCamera) {
            counts.camera++;
        } else if (object.isBone) {
            counts.bone++;
        } else if (object.isSkeleton) {
            counts.skeleton++;
        } else {
            counts.other++;
        }
  
        // Material count
        if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
                counts.material++;
                maps.materials.set(mat.uuid, mat);
                if (mat.map) {
                    counts.texture++;
                    maps.textures.set(mat.map.uuid, mat.map);
                }
            });
        } else if (object.material) {
            counts.material++;
            maps.materials.set(object.material.uuid, object.material);
            if (object.material.map) {
                counts.texture++;
                maps.textures.set(object.material.map.uuid, object.material.map);
            }
        }
    });
  
    console.log('Scene object counts:', counts);
    console.log('Unique materials:', maps.materials.size);
    console.log('Unique textures:', maps.textures.size);
    console.log('Unique geometries:', maps.geometries.size);
  
    return { counts, maps };
  }
  
  export function checkForMemoryLeaks(scene) {
    let previousData = null;
  
    setInterval(() => {
        const currentData = countSceneObjects(scene);
        trackMemoryUsage();
  
        if (previousData) {
            console.log('Changes since last check:');
            for (const [key, value] of Object.entries(currentData.counts)) {
                const diff = value - previousData.counts[key];
                if (diff !== 0) {
                    console.log(`${key}: ${diff}`);
                }
            }
  
            // Check for new or removed items
            ['materials', 'textures', 'geometries'].forEach(mapName => {
                currentData.maps[mapName].forEach((item, uuid) => {
                    if (!previousData.maps[mapName].has(uuid)) {
                        console.log(`New ${mapName.slice(0, -1)} added: ${uuid}`);
                    }
                });
  
                previousData.maps[mapName].forEach((item, uuid) => {
                    if (!currentData.maps[mapName].has(uuid)) {
                        console.log(`${mapName.slice(0, -1)} removed: ${uuid}`);
                    }
                });
            });
        }
  
        previousData = currentData;
    }, 5000); // 5초마다 실행
  }