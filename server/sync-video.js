const { VideoSeries, SeriesVideo } = require('./src/models');

const syncData = async () => {
    try {
        await VideoSeries.sync({ alter: true });
        await SeriesVideo.sync({ alter: true });
        console.log("Tables synchronized successfully");
    } catch (err) {
        console.error("Sync error: ", err);
    }
    process.exit(0);
}

syncData();
