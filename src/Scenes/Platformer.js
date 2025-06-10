class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");

        this.resetX;
        this.resetY;
        this.respawnTimer = -1;
        this.levelEndTimer = -1;
        this.playerDead = false;
        this.playerWin = false;
        this.song;
        this.victory;
    }

    init() {
        // variables and settings
        this.ACCELERATION = 1000;
        this.DRAG = 1500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.MAX_VELOCITY_X = 500;
        this.MAX_VELOCITY_Y = 1500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.physics.world.drawDebug = false;
        this.physics.world.TILE_BIAS = 20;
        this.resetX = 30;
        this.resetY = 1900;
    }

    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
        this.load.audio('song', 'assets/platformersong.mp3');
        this.load.audio('win', 'assets/platformerwin.mp3');
        this.load.audio('jumpaud', 'assets/platformerjump.wav');
        this.load.audio('collectaud', 'assets/gempickup.wav');
    }

    create() {
        // Create a new tilemap game object which uses 16x16 pixel tiles, and is
        // 50 tiles wide and 100 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 16, 16, 50, 100);
        this.animatedTiles.init(this.map);

        this.song = this.sound.add('song', {
            volume: 0.25,
            loop: true
        });
        
        this.victory = this.sound.add('win', {
            volume: 0.25,
            loop: false
        });

        this.jumpSound = this.sound.add('jumpaud', {
            volume: 1.4,
            loop: false
        })

        this.collectSound = this.sound.add('collectaud', {
            volume: 1,
            loop: false
        })

        this.anims.create({
            key: 'playerwalk',
            frames: this.anims.generateFrameNumbers('tilemap_sheet_transparent',
                {start: 261, end: 263}
            ),
            frameRate: 20,
            repeat: -1
        });

        this.anims.create({
            key: 'playeridle',
            frames: this.anims.generateFrameNumbers('tilemap_sheet_transparent',
                {start: 260, end: 260}
            )
        });

        this.anims.create({
            key: 'playerjump',
            frames: this.anims.generateFrameNumbers('tilemap_sheet_transparent',
                {start: 264, end: 264}
            )
        });

        /*
        this.anims.create({
            key: 'playerdeath',
            frames: this.anims.generateFrameNumbers('deathanims_sheet',
                {start: 0, end: 4}
            ),
            frameRate: 20,
            repeat: -1
        });
        */

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("monochrome_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.colorBGLayer = this.map.createLayer("ColorBG", this.tileset, 0, 0);
        this.backgroundLayer = this.map.createLayer("BG", this.tileset, 0, 0);
        this.hazardsLayer = this.map.createLayer("Hazards", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.hazardsLayer.setCollisionByProperty({
            collides: false
        });
        
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // TODO: Add createFromObjects here
        this.gems = this.map.createFromObjects("Objects", {
            name: "gem",
            key: 'gem_sheet',
            frames: this.anims.generateFrameNumbers('gem_sheet',
                {start: 0, end: 3}
            )
        });

        this.finalgem = this.map.createFromObjects("Objects", {
            name: "finalgem",
            key: "finalgem_tile"
        });

        this.checkpoints = this.map.createFromObjects("Checkpoints", {
            name: "checkpoint",
            key: "tilemap_sheet",
            frame: 77,
            activated: false
        });

        // TODO: Add turn into Arcade Physics here
        this.physics.world.enable(this.gems, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.finalgem, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.checkpoints, Phaser.Physics.Arcade.STATIC_BODY);
        this.gemGroup = this.add.group(this.gems);
        this.checkpointGroup = this.add.group(this.checkpoints);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.resetX, this.resetY, "start_frame");
        my.sprite.player.setCollideWorldBounds(false);
        my.sprite.player.setMaxVelocity(this.MAX_VELOCITY_X, this.MAX_VELOCITY_Y);
        my.sprite.player.setDisplaySize(24, 24);
        my.sprite.player.depth = 2;

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.hazardsLayer);

        // TODO: Add coin collision handler
        this.physics.add.overlap(my.sprite.player, this.gemGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.collectSound.play();
        });

        this.physics.add.overlap(my.sprite.player, this.finalgem, (obj1, obj2) => {
            obj2.destroy();
            this.collectSound.play();
            this.song.stop();
            this.victory.play();
            this.levelEndTimer = 400;
            this.playerWin = true;
        });

        this.physics.add.overlap(my.sprite.player, this.checkpointGroup, (obj1, obj2) => {
            if (!obj2.activated)
            {
                obj2.activated = true;
                this.resetX = obj2.x;
                this.resetY = obj2.y - 25;
                obj2.alpha *= 0.45;
            }
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, 'charcolor_sheet', {
            frame: [0, 1, 2, 3, 4, 5, 6, 7],
            depth: 0,
            scale: {start: 1.5, end: 1},
            maxAliveParticles: 5,
            lifespan: 50,
            // TODO: Try: gravityY: -400,
            alpha: {start: 0.5, end: 0.1},
        });

        my.vfx.walking.blendMode = Phaser.BlendModes.ADD;

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.song.play();
    }

    update() {
        this.respawnTimer--;
        this.levelEndTimer--;

        if (this.respawnTimer <= 0 && this.playerDead) { this.playerRespawn(); }
        if (this.levelEndTimer <= 0 && this.playerWin) 
        {
            this.playerWin = false;
            this.scene.restart();
        }
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('playerwalk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, 0, 0, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            my.vfx.walking.start();
        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('playerwalk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, 0, 0, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            my.vfx.walking.start();
        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('playeridle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        if (this.map.getTileAtWorldXY(my.sprite.player.x + 5 - (my.sprite.player.displayWidth / 2), 
                my.sprite.player.y + 5 - (my.sprite.player.displayHeight / 2), false, this.cameras.main, this.hazardsLayer)) { this.playerDeath(); }
        if (this.map.getTileAtWorldXY(my.sprite.player.x + my.sprite.player.displayWidth - 5 - (my.sprite.player.displayWidth / 2), 
                my.sprite.player.y + 5 - (my.sprite.player.displayHeight / 2), false, this.cameras.main, this.hazardsLayer)) { this.playerDeath(); }
        if (this.map.getTileAtWorldXY(my.sprite.player.x + 5 - (my.sprite.player.displayWidth / 2), 
                my.sprite.player.y + my.sprite.player.displayHeight - 5 - (my.sprite.player.displayHeight / 2), false, this.cameras.main, this.hazardsLayer)) { this.playerDeath(); }
        if (this.map.getTileAtWorldXY(my.sprite.player.x + my.sprite.player.displayWidth - 5 - (my.sprite.player.displayWidth / 2), 
                my.sprite.player.y + my.sprite.player.displayHeight - 5 - (my.sprite.player.displayHeight / 2), false, this.cameras.main, this.hazardsLayer)) { this.playerDeath(); }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) { my.sprite.player.anims.play('playerjump'); }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) { 
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.jumpSound.play(); 
        }
    }

    playerRespawn() {
        this.playerDead = false;
        my.sprite.player.x = this.resetX;
        my.sprite.player.y = this.resetY;
        this.physics.world.gravity.y = 1500;
        my.sprite.player.visible = true;
        my.sprite.player.setImmovable(false);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25);
    }

    playerDeath() {
        my.sprite.player.visible = false;
        this.physics.world.gravity.y = 0;
        my.sprite.player.x = 0;
        my.sprite.player.y = 0;
        this.physics.world.gravity.y = 0;
        this.cameras.main.stopFollow();
        this.respawnTimer = 60;
        this.playerDead = true;
    }
}