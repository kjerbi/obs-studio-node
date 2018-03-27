#pragma once
#include <obs.h>
#include <string>
#include <vector>
#include <io.h>
#include <iostream>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include "nodeobs_service.h"
#include <ipc-server.hpp>



using namespace std;

struct Screen {
	int width;
	int height;
};

class OBS_API
{
public:
	OBS_API();
	~OBS_API();

	// Example
	// static void Types(void* data, const int64_t id, const std::vector<IPC::Value>& args, std::vector<IPC::Value>& rval);

	static void OBS_API_initAPI(void* data, const int64_t id, const std::vector<IPC::Value>& args, std::vector<IPC::Value>& rval);
	static void OBS_API_destroyOBS_API(void* data, const int64_t id, const std::vector<IPC::Value>& args, std::vector<IPC::Value>& rval);
	static void OBS_API_getPerformanceStatistics(void* data, const int64_t id, const std::vector<IPC::Value>& args, std::vector<IPC::Value>& rval);
	static void OBS_API_getOBS_existingProfiles(void* data, const int64_t id, const std::vector<IPC::Value>& args, std::vector<IPC::Value>& rval);
	static void OBS_API_getOBS_existingSceneCollections(void* data, const int64_t id, const std::vector<IPC::Value>& args, std::vector<IPC::Value>& rval);


	// static void OBS_API_isOBS_installed(const FunctionCallbackInfo<Value>& args);
	static void OBS_API_isOBS_installed(void* data, const int64_t id, const std::vector<IPC::Value>& args, std::vector<IPC::Value>& rval);

private:
	static void initAPI(void);
    static void destroyOBS_API(void);
	static void openAllModules(void);

	static double 	getCPU_Percentage(void);
	static int 	 	getNumberOfDroppedFrames(void);
	static double 	getDroppedFramesPercentage(void);
	static double	getCurrentBandwidth(void);
	static double	getCurrentFrameRate(void);
	static bool		isOBS_installed(void);

public:
	static std::string 			getPathConfigDirectory(void);
	static void 				setPathConfigDirectory(std::string newPathConfigDirectory);
	static std::string 			getOBS_currentProfile(void);
	static void 				setOBS_currentProfile(std::string profileName);
	static std::string 			getOBS_currentSceneCollection(void);
	static void 				setOBS_currentSceneCollection(std::string sceneCollectionName);
	static bool 				isOBS_configFilesUsed(void);
	static std::vector<Screen> 	availableResolutions(void); 


	static std::string getGlobalConfigPath(void);
	static std::string getBasicConfigPath(void);
	static std::string getServiceConfigPath(void);
	static std::string getContentConfigPath(void);

	static void setAudioDeviceMonitoring(void);

	// Encoders
	static std::string getStreamingEncoderConfigPath(void);
	static std::string getRecordingEncoderConfigPath(void);

	static config_t* openConfigFile(std::string configFile);

	static void UpdateProcessPriority(void);
	static void SetProcessPriority(const char *priority);
};