CMAKE_MINIMUM_REQUIRED(VERSION 3.0)
PROJECT(obs-studio-server VERSION 0.0.1)

#############################
# CMake Settings
#############################

# Only allow Debug or Release builds.
SET(CMAKE_CONFIGURATION_TYPES           "Debug;Release")
SET(CMAKE_CXX_FLAGS_RELEASE             "${CMAKE_CXX_FLAGS_RELWITHDEBINFO}")
SET(CMAKE_C_FLAGS_RELEASE               "${CMAKE_C_FLAGS_RELWITHDEBINFO}")
SET(CMAKE_EXE_LINKER_FLAGS_RELEASE      "${CMAKE_EXE_LINKER_FLAGS_RELWITHDEBINFO}")
SET(CMAKE_MODULE_LINKER_FLAGS_RELEASE   "${CMAKE_MODULE_LINKER_FLAGS_RELWITHDEBINFO}")
SET(CMAKE_RC_LINKER_FLAGS_RELEASE       "${CMAKE_RC_LINKER_FLAGS_RELWITHDEBINFO}")
SET(CMAKE_SHARED_LINKER_FLAGS_RELEASE   "${CMAKE_SHARED_LINKER_FLAGS_RELWITHDEBINFO}")
SET(CMAKE_STATIC_LINKER_FLAGS_RELEASE   "${CMAKE_STATIC_LINKER_FLAGS_RELWITHDEBINFO}")

# Modules
SET(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake")
include(ExternalProject)
include(DownloadProject)

#############################
# Prerequisites
#############################

# OBS Studio (CPack Release)
download_project(
	PROJ libobs
	URL https://ci.appveyor.com/api/buildjobs/45gyrepd2hqmvj5a/artifacts/windows-x86_64-dev.zip
	UPDATE_DISCONNECTED 1
)
INCLUDE("${libobs_SOURCE_DIR}/cmake/LibObs/LibObsConfig.cmake")

#############################
# Source, Libraries & Directories
#############################
SET(PROJECT_SOURCE
	"${CMAKE_SOURCE_DIR}/source/error.hpp"
	"${PROJECT_SOURCE_DIR}/source/main.cpp"
	"${PROJECT_SOURCE_DIR}/source/shared.cpp" "${PROJECT_SOURCE_DIR}/source/shared.hpp"
	"${PROJECT_SOURCE_DIR}/source/utility.cpp" "${PROJECT_SOURCE_DIR}/source/utility.hpp"	
	"${PROJECT_SOURCE_DIR}/source/osn-nodeobs.cpp" "${PROJECT_SOURCE_DIR}/source/osn-nodeobs.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-audio.cpp" "${PROJECT_SOURCE_DIR}/source/osn-audio.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-audiocontrols.cpp" "${PROJECT_SOURCE_DIR}/source/osn-audiocontrols.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-calldata.cpp" "${PROJECT_SOURCE_DIR}/source/osn-calldata.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-common.cpp" "${PROJECT_SOURCE_DIR}/source/osn-common.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-display.cpp" "${PROJECT_SOURCE_DIR}/source/osn-display.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-filter.cpp" "${PROJECT_SOURCE_DIR}/source/osn-filter.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-global.cpp" "${PROJECT_SOURCE_DIR}/source/osn-global.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-iencoder.cpp" "${PROJECT_SOURCE_DIR}/source/osn-iencoder.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-input.cpp" "${PROJECT_SOURCE_DIR}/source/osn-input.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-module.cpp" "${PROJECT_SOURCE_DIR}/source/osn-module.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-output.cpp" "${PROJECT_SOURCE_DIR}/source/osn-output.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-properties.cpp" "${PROJECT_SOURCE_DIR}/source/osn-properties.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-scene.cpp" "${PROJECT_SOURCE_DIR}/source/osn-scene.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-sceneitem.cpp" "${PROJECT_SOURCE_DIR}/source/osn-sceneitem.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-service.cpp" "${PROJECT_SOURCE_DIR}/source/osn-service.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-source.cpp" "${PROJECT_SOURCE_DIR}/source/osn-source.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-transition.cpp" "${PROJECT_SOURCE_DIR}/source/osn-transition.hpp"
	"${PROJECT_SOURCE_DIR}/source/osn-video.cpp" "${PROJECT_SOURCE_DIR}/source/osn-video.hpp"
	
	# libobs++ Wrapper
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-audio.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-audio.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-display.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-display.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-encoder.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-encoder.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-filter.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-filter.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-index.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-input.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-input.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-output.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-output.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-module.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-module.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-output.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-properties.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-properties.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-scene.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-scene.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-service.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-service.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-source.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-source.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-transition.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-transition.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-video.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-video.hpp"
	"${PROJECT_SOURCE_DIR}/source/obspp/obspp-view.cpp" "${PROJECT_SOURCE_DIR}/source/obspp/obspp-view.hpp"
)
SET(PROJECT_LIBRARIES
	lib-streamlabs-ipc
	${LIBOBS_LIBRARIES}
)
SET(PROJECT_INCLUDE_PATHS
	"${CMAKE_SOURCE_DIR}/source"
	"${PROJECT_SOURCE_DIR}/source"
	"${lib-streamlabs-ipc_SOURCE_DIR}/include"
	${LIBOBS_INCLUDE_DIRS}	
)

#############################
# Building
#############################
ADD_EXECUTABLE(obs-studio-server ${PROJECT_SOURCE})
TARGET_LINK_LIBRARIES(obs-studio-server ${PROJECT_LIBRARIES})
TARGET_INCLUDE_DIRECTORIES(obs-studio-server PUBLIC ${PROJECT_INCLUDE_PATHS})

#############################
# Distribute
#############################
INSTALL(TARGETS obs-studio-server DESTINATION "${INSTALL_DIR}")
INSTALL(FILES $<TARGET_PDB_FILE:obs-studio-server> DESTINATION "${INSTALL_DIR}" OPTIONAL)
INSTALL(DIRECTORY ${PROJECT_DATA} DESTINATION "${INSTALL_DIR}/resources/" OPTIONAL)