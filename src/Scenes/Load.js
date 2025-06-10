class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");

        this.gemImage;
        this.finalGemImage
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("start_frame", "tile_0260.png");
        this.load.image("finalgem_tile", "tile_0102.png");
        this.load.image("death_frames", "deathanims.png");
        this.load.image("tilemap_tiles", "monochrome_tilemap_packed.png");            // Packed tilemap
        this.load.image("tilemap_tiles_transparent", "monochrome_tilemap_transparent_packed.png"); 
        this.load.image("gem_tiles", "gem_packed.png");
        this.load.image("charcolor_tiles", "1bitchar_color.png");
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "monochrome_tilemap_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet("tilemap_sheet_transparent", "monochrome_tilemap_transparent_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet("gem_sheet", "gem_packed.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet("charcolor_sheet", "1bitchar_color.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet("deathanims_sheet", "deathanims.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}