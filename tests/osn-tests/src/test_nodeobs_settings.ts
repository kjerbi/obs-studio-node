import 'mocha'
import { expect } from 'chai'
import * as osn from 'obs-studio-node';
import { OBSProcessHandler } from '../util/obs_process_handler';
import { deleteConfigFiles, basicOBSSettingsCategories } from '../util/general';

function getRandomValue(list: any) {
    const value = list[Math.floor(Math.random() * list.length)];
    return value[Object.keys(value)[0]];
}

describe('nodeobs_settings', function() {
    let obs: OBSProcessHandler;

    // Initialize OBS process
    before(function() {
        obs = new OBSProcessHandler();
        
        if (obs.startup() !== osn.EVideoCodes.Success)
        {
            throw new Error("Could not start OBS process. Aborting!")
        }
    });

    // Shutdown OBS process
    after(function() {
        obs.shutdown();
        obs = null;
        deleteConfigFiles();
    });

    context('# OBS_settings_saveSettings and OBS_settings_getSettings', function() {
        it('Get and set general settings', function() {
            // Getting general settings
            let generalSettings = osn.NodeObs.OBS_settings_getSettings('General');

            // Changing values of general settings
            generalSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {
                    if (parameter.type === 'OBS_PROPERTY_BOOL') {
                        if (parameter.currentValue === true) {
                            parameter.currentValue = false;
                        } else {
                            parameter.currentValue = true;
                        }
                    }

                    if (parameter.type === 'OBS_PROPERTY_DOUBLE') {
                        parameter.currentValue = parameter.currentValue + 1;
                    }
                });
            });

            // Setting the updated general settings
            osn.NodeObs.OBS_settings_saveSettings('General', generalSettings);

            // Checking if general settings were updated correctly
            const updatedGeneralSettings = osn.NodeObs.OBS_settings_getSettings('General');
            expect(generalSettings).to.eql(updatedGeneralSettings);
        });

        it('Get and set stream settings', function() {
            let availableServices: string[] = [];
            let settings = osn.NodeObs.OBS_settings_getSettings('Stream');

            // Getting available services
            settings[1].parameters.forEach(parameter => {
                if (parameter.name === 'service') {
                    parameter.values.forEach(serviceObject => {
                        const service = serviceObject[Object.keys(serviceObject)[0]];
                        availableServices.push(service);
                    });
                }
            });

            // Changing stream settings of all services available
            availableServices.forEach(service => {
                let setService = osn.NodeObs.OBS_settings_getSettings('Stream');

                // Setting stream service
                setService.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        if (parameter.name === 'service') {
                            parameter.currentValue = service;
                        }
                    });
                });

                osn.NodeObs.OBS_settings_saveSettings('Stream', setService);

                // Getting stream settings container
                let streamSettings = osn.NodeObs.OBS_settings_getSettings('Stream');

                // Changing stream settings values
                streamSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'service': {
                                expect(parameter.currentValue).to.equal(service);
                                break;
                            }
                            case 'server': {
                                // Selecting one random server
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'key': {
                                parameter.currentValue = '123test';
                                break;
                            }
                        }
                    });
                });

                // Setting the updated Twitch stream settings
                osn.NodeObs.OBS_settings_saveSettings('Stream', streamSettings);

                // Checking if stream settings were updated correctly
                const updatedStreamSettings = osn.NodeObs.OBS_settings_getSettings('Stream');
                expect(streamSettings).to.eql(updatedStreamSettings);
            });
        });

        it('Get and set simple output settings', function() {
            // Setting output mode to simple
            let setToSimple = osn.NodeObs.OBS_settings_getSettings('Output');

            setToSimple.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Mode';
            }).currentValue = 'Simple';

            osn.NodeObs.OBS_settings_saveSettings('Output', setToSimple);

            // Getting simple output settings container
            let setRecQualityAndReplayBuffer = osn.NodeObs.OBS_settings_getSettings('Output');

            // Getting available encoders
            const availableEncoders: string[] = setRecQualityAndReplayBuffer.find(category => {
                return category.nameSubCategory === 'Streaming';
            }).parameters.find(parameter => {
                return parameter.name === 'StreamEncoder';
            }).values;

            // Selecting one random available enconder
            const encoderObject = availableEncoders[Math.floor(Math.random() * availableEncoders.length)];
            const encoder = encoderObject[Object.keys(encoderObject)[0]];

            // Setting recording quality to same as stream and activating replay buffer
            setRecQualityAndReplayBuffer.find(category => {
                return category.nameSubCategory === 'Recording';
            }).parameters.find(parameter => {
                return parameter.name === 'RecQuality';
            }).currentValue = 'Stream';

            setRecQualityAndReplayBuffer.find(category => {
                return category.nameSubCategory === 'Replay Buffer';
            }).parameters.find(parameter => {
                return parameter.name === 'RecRB';
            }).currentValue = true;

            osn.NodeObs.OBS_settings_saveSettings('Output', setRecQualityAndReplayBuffer);

            // Getting simple output settings container with same as stream and replay buffer settings
            let sameAsStreamRBuffOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

            sameAsStreamRBuffOutputSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {
                    switch(parameter.name) {
                        case 'Mode': {
                            expect(parameter.currentValue).to.equal('Simple');
                            break;
                        }
                        // Streaming
                        case 'VBitrate': {
                            parameter.currentValue = 2000;
                            break;
                        }
                        case 'StreamEncoder': {
                            parameter.currentValue = encoder;
                            break;
                        }
                        case 'ABitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'FileNameWithoutSpace': {
                            parameter.currentValue = true;
                            break;
                        }
                        // Recording
                        case 'RecQuality': {
                            expect(parameter.currentValue).to.equal('Stream');
                            break;
                        }
                        case 'RecFormat': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'MuxerCustom': {
                            parameter.currentValue = 'test';
                            break;
                        }
                        case 'RecRB': {
                            expect(parameter.currentValue).to.equal(true);
                            break;
                        }
                        case 'RecRBTime': {
                            parameter.currentValue = 50;
                            break;
                        }
                    }
                });
            });

            // Setting the updated simple output settings
            osn.NodeObs.OBS_settings_saveSettings('Output', sameAsStreamRBuffOutputSettings);

            // Checking if output settings were updated correctly
            const updatedSameAsStreamRBuffOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
            expect(sameAsStreamRBuffOutputSettings).to.eql(updatedSameAsStreamRBuffOutputSettings);

            // Setting recording quality to high
            let setHighQuality = osn.NodeObs.OBS_settings_getSettings('Output');

            setHighQuality.find(category => {
                return category.nameSubCategory === 'Recording';
            }).parameters.find(parameter => {
                return parameter.name === 'RecQuality';
            }).currentValue = 'Small';

            osn.NodeObs.OBS_settings_saveSettings('Output', setHighQuality);

            // Getting simple output settings container with high quality settings
            let highQualityOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

            highQualityOutputSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {

                    switch(parameter.name) {
                        case 'Mode': {
                            expect(parameter.currentValue).to.equal('Simple');
                            break;
                        }
                        // Streaming
                        case 'VBitrate': {
                            parameter.currentValue = 3000;
                            break;
                        }
                        case 'StreamEncoder': {
                            expect(parameter.currentValue).to.equal(encoder);
                            break;
                        }
                        case 'ABitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'FileNameWithoutSpace': {
                            parameter.currentValue = false;
                            break;
                        }
                        // Recording
                        case 'RecQuality': {
                            expect(parameter.currentValue).to.equal('Small');
                            break;
                        }
                        case 'RecFormat': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'RecEncoder': {
                            parameter.currentValue = encoder;
                            break;
                        }
                    }
                });
            });

            // Setting simple output settings container with high quality settings
            osn.NodeObs.OBS_settings_saveSettings('Output', highQualityOutputSettings);

            // Checking if output settings were updated correctly
            const updatedHighQualityOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
            expect(highQualityOutputSettings).to.eql(updatedHighQualityOutputSettings);

            // Setting recording quality to indistinguishable
            let setIndistinguishableQuality = osn.NodeObs.OBS_settings_getSettings('Output');

            setIndistinguishableQuality.find(category => {
                return category.nameSubCategory === 'Recording';
            }).parameters.find(parameter => {
                return parameter.name === 'RecQuality';
            }).currentValue = 'HQ';

            osn.NodeObs.OBS_settings_saveSettings('Output', setIndistinguishableQuality);

            // Getting simple output settings container with indistinguishable recording quality settings
            let indistinguishableQualityOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

            indistinguishableQualityOutputSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {

                    switch(parameter.name) {
                        case 'Mode': {
                            expect(parameter.currentValue).to.equal('Simple');
                            break;
                        }
                        // Streaming
                        case 'VBitrate': {
                            parameter.currentValue = 4000;
                            break;
                        }
                        case 'StreamEncoder': {
                            expect(parameter.currentValue).to.equal(encoder);
                            break;
                        }
                        case 'ABitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'FileNameWithoutSpace': {
                            parameter.currentValue = true;
                            break;
                        }
                        // Recording
                        case 'RecQuality': {
                            expect(parameter.currentValue).to.equal('HQ');
                            break;
                        }
                        case 'RecFormat': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'RecEncoder': {
                            expect(parameter.currentValue).to.equal(encoder);
                            break;
                        }
                    }
                });
            });

            // Getting simple output settings container with indistinguishable recording quality settings
            osn.NodeObs.OBS_settings_saveSettings('Output', indistinguishableQualityOutputSettings);

            // Checking if output settings were updated correctly
            const updatedIndistinguishableOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
            expect(indistinguishableQualityOutputSettings).to.eql(updatedIndistinguishableOutputSettings);

             // Setting recording quality to lossless
            let setLosslessQuality = osn.NodeObs.OBS_settings_getSettings('Output');

            setLosslessQuality.find(category => {
                return category.nameSubCategory === 'Recording';
            }).parameters.find(parameter => {
                return parameter.name === 'RecQuality';
            }).currentValue = 'Lossless';
 
            osn.NodeObs.OBS_settings_saveSettings('Output', setLosslessQuality);

            // Getting simple output settings container with lossless recording quality settings
            let losslessQualityOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

            losslessQualityOutputSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {

                    switch(parameter.name) {
                        case 'Mode': {
                            expect(parameter.currentValue).to.equal('Simple');
                            break;
                        }
                        // Streaming
                        case 'VBitrate': {
                            parameter.currentValue = 5000;
                            break;
                        }
                        case 'StreamEncoder': {
                            expect(parameter.currentValue).to.equal(encoder);
                            break;
                        }
                        case 'ABitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'FileNameWithoutSpace': {
                            parameter.currentValue = false;
                            break;
                        }
                        // Recording
                        case 'RecQuality': {
                            expect(parameter.currentValue).to.equal('Lossless');
                            break;
                        }
                        case 'RecFormat': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                    }
                });
            });

            // Getting simple output settings container with indistinguishable recording quality settings
            osn.NodeObs.OBS_settings_saveSettings('Output', losslessQualityOutputSettings);

            // Checking if output settings were updated correctly
            const updatedLosslessOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
            expect(losslessQualityOutputSettings).to.eql(updatedLosslessOutputSettings);
        });

        it('Get and set QSV encoder streaming and recording advanced output settings', function() {
            let availableEncoders: string[] = [];

            // Setting output mode to advanced
            let setToAdvanced = osn.NodeObs.OBS_settings_getSettings('Output');

            setToAdvanced.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Mode';
            }).currentValue = 'Advanced';

            osn.NodeObs.OBS_settings_saveSettings('Output', setToAdvanced);

            // Getting advanced output settings container
            let setQSV = osn.NodeObs.OBS_settings_getSettings('Output');
            
            // Getting available encoders
            setQSV.find(category => {
                return category.nameSubCategory === 'Streaming';
            }).parameters.find(parameter => {
                return parameter.name === 'Encoder';
            }).values.forEach(encoderObject => {
                const encoder = encoderObject[Object.keys(encoderObject)[0]];
                availableEncoders.push(encoder);
            });

            // Checking if QSV encoder is available
            if (availableEncoders.indexOf('obs_qsv11') > -1) {
                // Setting encoder to QSV
                setQSV.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'Encoder';
                }).currentValue = 'obs_qsv11';

                setQSV.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'RecEncoder';
                }).currentValue = 'obs_qsv11';

                osn.NodeObs.OBS_settings_saveSettings('Output', setQSV);

                // Setting rate control to CBR
                let setCBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setCBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CBR';

                setCBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setCBR);

                // Getting advanced output settings container with CBR parameters
                let cbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                cbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'TrackIndex': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'ApplyServiceSettings': {
                                parameter.currentValue = false;
                                break;
                            }
                            case 'target_usage': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'profile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'keyint_sec': {
                                parameter.currentValue = 2;
                                break;
                            }
                            case 'async_depth': {
                                parameter.currentValue = 1;
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 3000;
                                break;
                            }
                            // Recording
                            case 'RecFilePath': {
                                parameter.currentValue = 'C:\\Test';
                                break;
                            }
                            case 'RecFormat': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'RecTracks': {
                                parameter.currentValue = 2;
                                break;
                            }
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'RecMuxerCustom': {
                                parameter.currentValue = 'test';
                                break;
                            }
                            case 'Rectarget_usage': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Recprofile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Reckeyint_sec': {
                                parameter.currentValue = 4;
                                break;
                            }
                            case 'Recasync_depth': {
                                parameter.currentValue = 5;
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 5500;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with CBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', cbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedCBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(cbrOutputSettings).to.eql(updatedCBROutputSettings);

                // Setting rate control to VBR
                let setVBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setVBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'VBR';

                setVBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'VBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setVBR);

                // Getting advanced output settings container with VBR parameters
                let vbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                vbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 2000;
                                break;
                            }
                            case 'max_bitrate': {
                                parameter.currentValue = 6000;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 3000;
                                break;
                            }
                            case 'Recmax_bitrate': {
                                parameter.currentValue = 5000;
                                break;
                            }
                        }
                    });
                });

                // Setting advanced output settings container with VBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', vbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedVBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(vbrOutputSettings).to.eql(updatedVBROutputSettings);

                // Setting rate control to VCM
                let setVCM = osn.NodeObs.OBS_settings_getSettings('Output');

                setVCM.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'VCM';

                setVCM.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'VCM';

                osn.NodeObs.OBS_settings_saveSettings('Output', setVCM);

                // Getting advanced output settings container with VCM parameters
                let vcmOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                vcmOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('VCM');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 1000;
                                break;
                            }
                            case 'max_bitrate': {
                                parameter.currentValue = 4000;
                                break;
                            }
                            //Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('VCM');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 1000;
                                break;
                            }
                            case 'Recmax_bitrate': {
                                parameter.currentValue = 2000;
                                break;
                            }
                        }
                    });
                });

                // Setting advanced output settings container with VCM parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', vcmOutputSettings);

                // Checking if settings were updated correctly
                const updatedVCMOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(vcmOutputSettings).to.eql(updatedVCMOutputSettings);

                // Setting rate control to CQP
                let setCQP = osn.NodeObs.OBS_settings_getSettings('Output');

                setCQP.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CQP';

                setCQP.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CQP';

                osn.NodeObs.OBS_settings_saveSettings('Output', setCQP);

                // Getting advanced output settings container with CQP parameters
                let cqpOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                cqpOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CQP');
                                break;
                            }
                            case 'qpi': {
                                parameter.currentValue = 25;
                                break;
                            }
                            case 'qpp': {
                                parameter.currentValue = 26;
                                break;
                            }
                            case 'qpb': {
                                parameter.currentValue = 27;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CQP');
                                break;
                            }
                            case 'Recqpi': {
                                parameter.currentValue = 15;
                                break;
                            }
                            case 'Recqpp': {
                                parameter.currentValue = 17;
                                break;
                            }
                            case 'Recqpb': {
                                parameter.currentValue = 13;
                                break;
                            }
                        }
                    });
                });

                // Setting advanced output settings container with CQP parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', cqpOutputSettings);

                // Checking if settings were updated correctly
                const updatedCQPOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(cqpOutputSettings).to.eql(updatedCQPOutputSettings);

                // Setting rate control to AVBR
                let setAVBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setAVBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'AVBR';

                setAVBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'AVBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setAVBR);

                // Getting advanced output settings container with AVBR parameters
                let avbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                avbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('AVBR');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 6000;
                                break;
                            }
                            case 'accuracy': {
                                parameter.currentValue = 1000;
                                break;
                            }
                            case 'convergence': {
                                parameter.currentValue = 2;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('AVBR');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 4500;
                                break;
                            }
                            case 'Recaccuracy': {
                                parameter.currentValue = 1500;
                                break;
                            }
                            case 'Recconvergence': {
                                parameter.currentValue = 3;
                                break;
                            }
                        }
                    });
                });

                // Setting advanced output settings container with AVBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', avbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedAVBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(avbrOutputSettings).to.eql(updatedAVBROutputSettings);

                // Setting rate control to ICQ
                let setICQ = osn.NodeObs.OBS_settings_getSettings('Output');

                setICQ.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'ICQ';

                setICQ.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'ICQ';

                osn.NodeObs.OBS_settings_saveSettings('Output', setICQ);

                // Getting advanced output settings container with ICQ parameters
                let icqOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                icqOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('ICQ');
                                break;
                            }
                            case 'icq_quality': {
                                parameter.currentValue = 30;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('ICQ');
                                break;
                            }
                            case 'Recicq_quality': {
                                parameter.currentValue = 50;
                                break;
                            }
                        }
                    });
                });

                // Setting advanced output settings container with ICQ parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', icqOutputSettings);

                // Checking if settings were updated correctly
                const updatedICQOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(icqOutputSettings).to.eql(updatedICQOutputSettings);

                // Setting rate control to LA_ICQ
                let setLA_ICQ = osn.NodeObs.OBS_settings_getSettings('Output');

                setLA_ICQ.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'LA_ICQ';

                setLA_ICQ.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'LA_ICQ';

                osn.NodeObs.OBS_settings_saveSettings('Output', setLA_ICQ);

                // Getting advanced output settings container with LA_ICQ parameters
                let la_icqOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                la_icqOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('LA_ICQ');
                                break;
                            }
                            case 'icq_quality': {
                                parameter.currentValue = 10;
                                break;
                            }
                            case 'la_depth': {
                                parameter.currentValue = 50;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'recrate_control': {
                                expect(parameter.currentValue).to.equal('LA_ICQ');
                                break;
                            }
                            case 'Recicq_quality': {
                                parameter.currentValue = 200;
                                break;
                            }
                            case 'Recla_depth': {
                                parameter.currentValue = 35;
                                break;
                            }
                        }
                    });
                });

                // Setting advanced output settings container with LA_ICQ parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', la_icqOutputSettings);

                // Checking if settings were updated correctly
                const updatedLA_ICQOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(la_icqOutputSettings).to.eql(updatedLA_ICQOutputSettings);

                // Setting rate control to LA
                let setLA = osn.NodeObs.OBS_settings_getSettings('Output');

                setLA.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'LA';

                setLA.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'LA';

                // Setting rescale to true
                setLA.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'Rescale';
                }).currentValue = true;

                setLA.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'RecRescale';
                }).currentValue = true;

                osn.NodeObs.OBS_settings_saveSettings('Output', setLA);

                // Getting advanced output settings container with LA parameters
                let laOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                laOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'Rescale': {
                                expect(parameter.currentValue).to.equal(true);
                                break;
                            }
                            case 'RescaleRes': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('LA');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 5500;
                                break;
                            }
                            case 'la_depth': {
                                parameter.currentValue = 40;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_qsv11');
                                break;
                            }
                            case 'RecRescale': {
                                expect(parameter.currentValue).to.equal(true);
                                break;
                            }
                            case 'RecRescaleRes': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('LA');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 3000;
                                break;
                            }
                            case 'Recla_depth': {
                                parameter.currentValue = 20;
                                break;
                            }
                        }
                    });
                });

                // Setting advanced output settings container with LA parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', laOutputSettings);

                // Checking if LA advanced settings were updated correctly
                const updatedLAOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(laOutputSettings).to.eql(updatedLAOutputSettings);
            } else {
                console.log('      * QSV encoder is not available, skipping test case.');
                this.skip();
            }
        });

        it('Get and set x264 encoder streaming and recording advanced output settings', function() {
            let availableEncoders: string[] = [];

            // Setting output mode to advanced
            let setToAdvanced = osn.NodeObs.OBS_settings_getSettings('Output');

            setToAdvanced.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Mode';
            }).currentValue = 'Advanced';

            osn.NodeObs.OBS_settings_saveSettings('Output', setToAdvanced);

            // Getting advanced output settings container
            let setx264 = osn.NodeObs.OBS_settings_getSettings('Output');

            // Getting available encoders
            setx264.find(category => {
                return category.nameSubCategory === 'Streaming';
            }).parameters.find(parameter => {
                return parameter.name === 'Encoder';
            }).values.forEach(encoderObject => {
                const encoder = encoderObject[Object.keys(encoderObject)[0]];
                availableEncoders.push(encoder);
            });

            // Checking if x264 encoder is available
            if (availableEncoders.indexOf('obs_x264') > -1) {
                // Setting encoder to x264
                setx264.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'Encoder';
                }).currentValue = 'obs_x264';

                setx264.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'RecEncoder';
                }).currentValue = 'obs_x264';

                osn.NodeObs.OBS_settings_saveSettings('Output', setx264);

                // Setting rate control to CBR
                let setCBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setCBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CBR';

                setCBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CBR';

                let selectedFormat;

                selectedFormat = getRandomValue(setCBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'RecFormat';
                }).values);

                setCBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'RecFormat';
                }).currentValue = selectedFormat;

                osn.NodeObs.OBS_settings_saveSettings('Output', setCBR);

                // Getting advanced output settings container with CBR parameters
                let cbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                cbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'TrackIndex': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'ApplyServiceSettings': {
                                parameter.currentValue = true;
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 3000;
                                break;
                            }
                            case 'keyint_sec': {
                                parameter.currentValue = 5;
                                break;
                            }
                            case 'preset': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'profile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'tune': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'x264opts': {
                                parameter.currentValue = 'test';
                                break;
                            }
                            // Recording
                            case 'RecFilePath': {
                                parameter.currentValue = 'C:\\Test\\AnotherTest';
                                break;
                            }
                            case 'RecFormat': {
                                expect(parameter.currentValue).to.equal(selectedFormat);
                                break;
                            }
                            case 'RecTracks': {
                                if(selectedFormat === 'flv') {
                                    parameter.currentValue = 1;
                                }
                                else {
                                    parameter.currentValue = 4;
                                }
                                break;
                            }
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'RecMuxerCustom': {
                                parameter.currentValue = 'anotherTest';
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 4100;
                                break;
                            }
                            case 'Reckeyint_sec': {
                                parameter.currentValue = 2;
                                break;
                            }
                            case 'Recpreset': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Recprofile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Rectune': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Recx264opts': {
                                parameter.currentValue = 'anotherTest';
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with CBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', cbrOutputSettings);

                // Checking settings were updated correctly
                const updatedCBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                
                expect(cbrOutputSettings).to.eql(updatedCBROutputSettings);

                // Setting rate control to ABR
                let setABR = osn.NodeObs.OBS_settings_getSettings('Output');

                setABR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'ABR';

                setABR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'use_bufsize';
                }).currentValue = true;

                setABR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'ABR';

                setABR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recuse_bufsize';
                }).currentValue = true;

                osn.NodeObs.OBS_settings_saveSettings('Output', setABR);

                // Getting advanced output settings container with ABR parameters
                let abrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                abrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('ABR');
                                break;
                            }
                            case 'use_bufsize': {
                                expect(parameter.currentValue).to.equal(true);
                                break;
                            }
                            case 'buffer_size': {
                                parameter.currentValue = 3500;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('ABR');
                                break;
                            }
                            case 'Recuse_bufsize': {
                                expect(parameter.currentValue).to.equal(true);
                                break;
                            }
                            case 'Recbuffer_size': {
                                parameter.currentValue = 1500;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with ABR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', abrOutputSettings);

                // Checking if settings were updated correctly
                const updatedABROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(abrOutputSettings).to.eql(updatedABROutputSettings);

                // Setting rate control to VBR
                let setVBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setVBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'VBR';

                setVBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'VBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setVBR);

                // Getting advanced output settings container with VBR parameters
                let vbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                vbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                            case 'crf': {
                                parameter.currentValue = 26;
                                break;
                            }
                            case 'keyint_sec': {
                                parameter.currentValue = 2;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                            case 'Reccrf': {
                                parameter.currentValue = 18;
                                break;
                            }
                            case 'Reckeyint_sec': {
                                parameter.currentValue = 7;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with VBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', vbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedVBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(vbrOutputSettings).to.eql(updatedVBROutputSettings);

                // Setting rate control to CRF
                let setCRF = osn.NodeObs.OBS_settings_getSettings('Output');

                setCRF.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CRF';

                setCRF.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CRF';

                osn.NodeObs.OBS_settings_saveSettings('Output', setCRF);

                // Getting advanced output settings container with CRF parameters
                let crfOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                crfOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CRF');
                                break;
                            }
                            case 'crf': {
                                parameter.currentValue = 8;
                                break;
                            }
                            case 'keyint_sec': {
                                parameter.currentValue = 6;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('obs_x264');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CRF');
                                break;
                            }
                            case 'Reccrf': {
                                parameter.currentValue = 11;
                                break;
                            }
                            case 'Reckeyint_sec': {
                                parameter.currentValue = 2;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with CRF parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', crfOutputSettings);

                // Checking if settings were updated correctly
                const updatedCRFOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(crfOutputSettings).to.eql(updatedCRFOutputSettings);
            } else {
                console.log('       * x264 encoder is not available, skipping test case.');
                this.skip();
            }
        });

        it('Get and set NVENC encoder streaming and recording advanced output settings', function() {
            let availableEncoders: string[] = [];

            // Setting output mode to advanced
            let setToAdvanced = osn.NodeObs.OBS_settings_getSettings('Output');

            setToAdvanced.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Mode';
            }).currentValue = 'Advanced';

            osn.NodeObs.OBS_settings_saveSettings('Output', setToAdvanced);

            // Getting advanced output settings container
            let setNVENC = osn.NodeObs.OBS_settings_getSettings('Output');

            // Getting available encoders
            setNVENC.find(category => {
                return category.nameSubCategory === 'Streaming';
            }).parameters.find(parameter => {
                return parameter.name === 'Encoder';
            }).values.forEach(encoderObject => {
                const encoder = encoderObject[Object.keys(encoderObject)[0]];
                availableEncoders.push(encoder);
            });

            // Checking if NVENC encoder is available
            if (availableEncoders.indexOf('ffmpeg_nvenc') > -1) {
                // Setting encoder to NVENC
                setNVENC.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'Encoder';
                }).currentValue = 'ffmpeg_nvenc';

                setNVENC.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'RecEncoder';
                }).currentValue = 'ffmpeg_nvenc';

                osn.NodeObs.OBS_settings_saveSettings('Output', setNVENC);

                // Setting rating control to CBR
                let setCBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setCBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CBR';

                setCBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setCBR);

                // Getting advanced output settings container with CBR parameters
                let cbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                cbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming 
                            case 'TrackIndex': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'ApplyServiceSettings': {
                                parameter.currentValue = false;
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 3000;
                                break;
                            }
                            case 'keyint_sec': {
                                parameter.currentValue = 5;
                                break;
                            }
                            case 'preset': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'profile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'gpu': {
                                parameter.currentValue = 1;
                                break;
                            }
                            case 'bf': {
                                parameter.currentValue = 3;
                                break;
                            }
                            // Recording
                            case 'RecFilePath': {
                                parameter.currentValue = 'C:\\Test\\AnotherTest\\MoreTest';
                                break;
                            }
                            case 'RecFormat': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'RecTracks': {
                                parameter.currentValue = 6;
                                break;
                            }
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'RecMuxerCustom': {
                                parameter.currentValue = 'moreTest';
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 3200;
                                break;
                            }
                            case 'Reckeyint_sec': {
                                parameter.currentValue = 9;
                                break;
                            }
                            case 'Recpreset': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Recprofile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Recgpu': {
                                parameter.currentValue = 2;
                                break;
                            }
                            case 'Recbf': {
                                parameter.currentValue = 5;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with CBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', cbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedCBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(cbrOutputSettings).to.eql(updatedCBROutputSettings);

                // Setting rate control to VBR
                let setVBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setVBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'VBR';

                setVBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'VBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setVBR);

                // Getting advanced output settings container with VBR parameters
                let vbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                vbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with VBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', vbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedVBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(vbrOutputSettings).to.eql(updatedVBROutputSettings);

                // Setting rate control to CQP
                let setCQP = osn.NodeObs.OBS_settings_getSettings('Output');

                setCQP.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CQP';

                setCQP.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CQP';

                osn.NodeObs.OBS_settings_saveSettings('Output', setCQP);

                // Getting advanced output settings container with CQP parameters
                let cqpOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                cqpOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CQP');
                                break;
                            }
                            case 'cqp': {
                                parameter.currentValue = 25;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CQP');
                                break;
                            }
                            case 'Reccqp': {
                                parameter.currentValue = 31;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with CQP parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', cqpOutputSettings);

                // Checking if settings were updated correctly
                const updatedCQPOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(cqpOutputSettings).to.eql(updatedCQPOutputSettings);

                // Setting rate control to Lossless
                let setLossless = osn.NodeObs.OBS_settings_getSettings('Output');

                setLossless.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'lossless';

                setLossless.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'lossless';

                osn.NodeObs.OBS_settings_saveSettings('Output', setLossless);

                // Getting advanced output settings container with Lossless parameters
                let losslessOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                losslessOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('lossless');
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('ffmpeg_nvenc');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('lossless');
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with Lossless parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', losslessOutputSettings);

                // Checking if Lossless advanced settings were updated correctly
                const updatedLosslessOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(losslessOutputSettings).to.eql(updatedLosslessOutputSettings);
            } else {
                console.log('      * NVENC encoder is not available, skipping test case.');
                this.skip();
            }
        });

        it('Get and set New NVENC encoder streaming and recording advanced output settings', function() {
            let availableEncoders: string[] = [];

            // Setting output mode to advanced
            let setToAdvanced = osn.NodeObs.OBS_settings_getSettings('Output');

            setToAdvanced.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Mode';
            }).currentValue = 'Advanced';

            osn.NodeObs.OBS_settings_saveSettings('Output', setToAdvanced);

            // Getting advanced output settings container
            let setNewNVENC = osn.NodeObs.OBS_settings_getSettings('Output');

            // Getting available encoders
            setNewNVENC.find(category => {
                return category.nameSubCategory === 'Streaming';
            }).parameters.find(parameter => {
                return parameter.name === 'Encoder';
            }).values.forEach(encoderObject => {
                const encoder = encoderObject[Object.keys(encoderObject)[0]];
                availableEncoders.push(encoder);
            });

            // Checking if NVENC encoder is available
            if (availableEncoders.indexOf('ffmpeg_nvenc') > -1) {
                // Setting encoder to new NVENC
                setNewNVENC.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'Encoder';
                }).currentValue = 'jim_nvenc';

                setNewNVENC.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'RecEncoder';
                }).currentValue = 'jim_nvenc';

                osn.NodeObs.OBS_settings_saveSettings('Output', setNewNVENC);

                // Setting rating control to CBR
                let setCBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setCBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CBR';

                setCBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setCBR);

                // Getting advanced output settings container with CBR parameters
                let cbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                cbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming 
                            case 'TrackIndex': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'ApplyServiceSettings': {
                                parameter.currentValue = false;
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'bitrate': {
                                parameter.currentValue = 5200;
                                break;
                            }
                            case 'keyint_sec': {
                                parameter.currentValue = 1
                                break;
                            }
                            case 'preset': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'profile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'lookahead': {
                                parameter.currentValue = false;
                                break;
                            }
                            case 'psycho_aq': {
                                parameter.currentValue = true;
                                break;
                            }
                            case 'gpu': {
                                parameter.currentValue = 1;
                                break;
                            }
                            case 'bf': {
                                parameter.currentValue = 5;
                                break;
                            }
                            // Recording
                            case 'RecFilePath': {
                                parameter.currentValue = 'C:\\Test\\AnotherTest\\MoreTest';
                                break;
                            }
                            case 'RecFormat': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'RecTracks': {
                                parameter.currentValue = 3;
                                break;
                            }
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'RecMuxerCustom': {
                                parameter.currentValue = 'moreTest';
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CBR');
                                break;
                            }
                            case 'Recbitrate': {
                                parameter.currentValue = 5400;
                                break;
                            }
                            case 'Reckeyint_sec': {
                                parameter.currentValue = 2;
                                break;
                            }
                            case 'Recpreset': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Recprofile': {
                                parameter.currentValue = getRandomValue(parameter.values);
                                break;
                            }
                            case 'Reclookahead': {
                                parameter.currentValue = false;
                                break;
                            }
                            case 'Recpsycho_aq': {
                                parameter.currentValue = true;
                                break;
                            }
                            case 'Recgpu': {
                                parameter.currentValue = 1;
                                break;
                            }
                            case 'Recbf': {
                                parameter.currentValue = 2;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with CBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', cbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedCBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(cbrOutputSettings).to.eql(updatedCBROutputSettings);

                // Setting rate control to VBR
                let setVBR = osn.NodeObs.OBS_settings_getSettings('Output');

                setVBR.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'VBR';

                setVBR.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'VBR';

                osn.NodeObs.OBS_settings_saveSettings('Output', setVBR);

                // Getting advanced output settings container with VBR parameters
                let vbrOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                vbrOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('VBR');
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with VBR parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', vbrOutputSettings);

                // Checking if settings were updated correctly
                const updatedVBROutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(vbrOutputSettings).to.eql(updatedVBROutputSettings);

                // Setting rate control to CQP
                let setCQP = osn.NodeObs.OBS_settings_getSettings('Output');

                setCQP.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'CQP';

                setCQP.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'CQP';

                osn.NodeObs.OBS_settings_saveSettings('Output', setCQP);

                // Getting advanced output settings container with CQP parameters
                let cqpOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                cqpOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('CQP');
                                break;
                            }
                            case 'cqp': {
                                parameter.currentValue = 35;
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('CQP');
                                break;
                            }
                            case 'Reccqp': {
                                parameter.currentValue = 40;
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with CQP parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', cqpOutputSettings);

                // Checking if settings were updated correctly
                const updatedCQPOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(cqpOutputSettings).to.eql(updatedCQPOutputSettings);

                // Setting rate control to Lossless
                let setLossless = osn.NodeObs.OBS_settings_getSettings('Output');

                setLossless.find(category => {
                    return category.nameSubCategory === 'Streaming';
                }).parameters.find(parameter => {
                    return parameter.name === 'rate_control';
                }).currentValue = 'lossless';

                setLossless.find(category => {
                    return category.nameSubCategory === 'Recording';
                }).parameters.find(parameter => {
                    return parameter.name === 'Recrate_control';
                }).currentValue = 'lossless';

                osn.NodeObs.OBS_settings_saveSettings('Output', setLossless);

                // Getting advanced output settings container with Lossless parameters
                let losslessOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');

                losslessOutputSettings.forEach(subCategory => {
                    subCategory.parameters.forEach(parameter => {
                        switch(parameter.name) {
                            case 'Mode': {
                                expect(parameter.currentValue).to.equal('Advanced');
                                break;
                            }
                            // Streaming
                            case 'Encoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'rate_control': {
                                expect(parameter.currentValue).to.equal('lossless');
                                break;
                            }
                            // Recording
                            case 'RecEncoder': {
                                expect(parameter.currentValue).to.equal('jim_nvenc');
                                break;
                            }
                            case 'Recrate_control': {
                                expect(parameter.currentValue).to.equal('lossless');
                                break;
                            }
                        }
                    });
                });
                
                // Setting advanced output settings container with Lossless parameters
                osn.NodeObs.OBS_settings_saveSettings('Output', losslessOutputSettings);

                // Checking if Lossless advanced settings were updated correctly
                const updatedLosslessOutputSettings = osn.NodeObs.OBS_settings_getSettings('Output');
                expect(losslessOutputSettings).to.eql(updatedLosslessOutputSettings);
            } else {
                console.log('      * New NVENC encoder is not available, skipping test case.');
                this.skip();
            }
        });

        it('Get and set audio tracks and replay buffer advanced output settings', function() {
            // Setting output mode to advanced
            let setToAdvanced = osn.NodeObs.OBS_settings_getSettings('Output');

            setToAdvanced.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Mode';
            }).currentValue = 'Advanced';

            setToAdvanced.find(category => {
                return category.nameSubCategory === 'Replay Buffer';
            }).parameters.find(parameter => {
                return parameter.name === 'RecRB';
            }).currentValue = true;

            osn.NodeObs.OBS_settings_saveSettings('Output', setToAdvanced);

            // Getting advanced output settings
            let audioTrackReplayBufferSettings = osn.NodeObs.OBS_settings_getSettings('Video');

            audioTrackReplayBufferSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {
                    switch(parameter.name) {
                        case 'Mode': {
                            expect(parameter.currentValue).to.equal('Advanced');
                            break;
                        }
                        case 'Track1Bitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'Track1Name': {
                            parameter.currentValue = 'Test1';
                            break;
                        }
                        case 'Track2Bitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'Track2Name': {
                            parameter.currentValue = 'Test2';
                            break;
                        }
                        case 'Track3Bitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'Track3Name': {
                            parameter.currentValue = 'Test3';
                            break;
                        }
                        case 'Track4Bitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'Track4Name': {
                            parameter.currentValue = 'Test4';
                            break;
                        }
                        case 'Track5Bitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'Track5Name': {
                            parameter.currentValue = 'Test5';
                            break;
                        }
                        case 'Track6Bitrate': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'Track6Name': {
                            parameter.currentValue = 'Test6';
                            break;
                        }
                        case 'RecRB': {
                            expect(parameter.currentValue).to.equal(true);
                            break;
                        }
                        case 'RecRBTime': {
                            parameter.currentValue = 60;
                            break;
                        }
                    }
                });
            });

            // Setting advanced output settings
            osn.NodeObs.OBS_settings_saveSettings('Video', audioTrackReplayBufferSettings);

            // Checking if settings were updated correctly
            const updatedSettings = osn.NodeObs.OBS_settings_getSettings('Video');
            expect(audioTrackReplayBufferSettings).to.eql(updatedSettings);
        });

        it('Get and set video settings', function() {
            // Setting base resolution to 1920x1080 and FPS type to common
            let set1080pAndCommonFPS = osn.NodeObs.OBS_settings_getSettings('Video');

            set1080pAndCommonFPS.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Base';
            }).currentValue = '1920x1080';

            set1080pAndCommonFPS.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'FPSType';
            }).currentValue = 'Common FPS Values';

            osn.NodeObs.OBS_settings_saveSettings('Video', set1080pAndCommonFPS);

            // Getting video settings container with common fps settings
            let commonFPSVideoSettings = osn.NodeObs.OBS_settings_getSettings('Video');

            commonFPSVideoSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {
                    switch(parameter.name) {
                        case 'Base': {
                            expect(parameter.currentValue).to.equal('1920x1080');
                            break;
                        }
                        case 'Output': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'ScaleType': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'FPSType': {
                            expect(parameter.currentValue).to.equal('Common FPS Values');
                            break;
                        }
                        case 'FPSCommon': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                    }
                });
            });

            // Setting video settings container with common FPS settings
            osn.NodeObs.OBS_settings_saveSettings('Video', commonFPSVideoSettings);

            // Checking if settings were updated correctly
            const updatedCommonFPSVideoSettings = osn.NodeObs.OBS_settings_getSettings('Video');
            expect(commonFPSVideoSettings).to.eql(updatedCommonFPSVideoSettings);

            // Setting base resolution to 1280x720 and FPS type to integer
            let set720pAndIntegerFPS = osn.NodeObs.OBS_settings_getSettings('Video');

            set720pAndIntegerFPS.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'Base';
            }).currentValue = '1280x720';

            set720pAndIntegerFPS.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'FPSType';
            }).currentValue = 'Integer FPS Value';

            osn.NodeObs.OBS_settings_saveSettings('Video', set720pAndIntegerFPS);

            // Getting video settings container with integer FPS settings
            let integerFPSVideoSettings = osn.NodeObs.OBS_settings_getSettings('Video');

            integerFPSVideoSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {
                    switch(parameter.name) {
                        case 'Base': {
                            expect(parameter.currentValue).to.equal('1280x720');
                            break;
                        }
                        case 'FPSType': {
                            expect(parameter.currentValue).to.equal('Integer FPS Value');
                            break;
                        }
                        case 'FPSInt': {
                            parameter.currentValue = 60;
                            break;
                        }
                    }
                });
            });

            // Setting video settings container with integer FPS settings
            osn.NodeObs.OBS_settings_saveSettings('Video', integerFPSVideoSettings);

            // Checking if settings were updated correctly
            const updatedIntegerFPSVideoSettings = osn.NodeObs.OBS_settings_getSettings('Video');
            expect(integerFPSVideoSettings).to.eql(updatedIntegerFPSVideoSettings);

            // Setting FPS type to fractional
            let setFractionalFPS = osn.NodeObs.OBS_settings_getSettings('Video');

            setFractionalFPS.find(category => {
                return category.nameSubCategory === 'Untitled';
            }).parameters.find(parameter => {
                return parameter.name === 'FPSType';
            }).currentValue = 'Fractional FPS Value';

            osn.NodeObs.OBS_settings_saveSettings('Video', setFractionalFPS);

            // Getting video settings container with fractional FPS settings
            let fractionalFPSVideoSettings = osn.NodeObs.OBS_settings_getSettings('Video');

            fractionalFPSVideoSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {
                    switch(parameter.name) {
                        case 'FPSType': {
                            expect(parameter.currentValue).to.equal('Fractional FPS Value');
                            break;
                        }
                        case 'FPSNum': {
                            parameter.currentValue = 90;
                            break;
                        }
                        case 'FPSDen': {
                            parameter.currentValue = 5;
                            break;
                        }
                    }
                });
            });

            // Setting video settings container with integer FPS settings
            osn.NodeObs.OBS_settings_saveSettings('Video', fractionalFPSVideoSettings);

            // Checking if settings were updated correctly
            const updatedFractionalFPSVideoSettings = osn.NodeObs.OBS_settings_getSettings('Video');
            expect(fractionalFPSVideoSettings).to.eql(updatedFractionalFPSVideoSettings);
        });

        it('Get and set advanced settings', function() {
            // Getting advanced settings container
            let advancedSettings = osn.NodeObs.OBS_settings_getSettings('Advanced');

            // Changing advanced settings values
            advancedSettings.forEach(subCategory => {
                subCategory.parameters.forEach(parameter => {
                    switch(parameter.name) {
                        case 'ProcessPriority': {
                            parameter.currentValue = 'AboveNormal';
                            break;
                        }
                        case 'ColorFormat': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'ColorSpace': {
                            parameter.currentValue = getRandomValue(parameter.values);
                            break;
                        }
                        case 'ForceGPUAsRenderDevice': {
                            parameter.currentValue = false;
                            break;
                        }
                        case 'DisableAudioDucking': {
                            parameter.currentValue = true;
                            break;
                        }
                        case 'FilenameFormatting': {
                            parameter.currentValue = '%CCYY-%MM-%DD';
                            break;
                        }
                        case 'OverwriteIfExists': {
                            parameter.currentValue = true;
                            break;
                        }
                        case 'RecRBPrefix': {
                            parameter.currentValue = 'TestPrefix';
                            break;
                        }
                        case 'RecRBSuffix': {
                            parameter.currentValue = 'TestSuffix';
                            break;
                        }
                        case 'DelayEnable': {
                            parameter.currentValue = true;
                            break;
                        }
                        case 'DelaySec': {
                            parameter.currentValue = 60;
                            break;
                        }
                        case 'DelayPreserve': {
                            parameter.currentValue = false;
                            break;
                        }
                        case 'Reconnect': {
                            parameter.currentValue = false;
                            break;
                        }
                        case 'RetryDelay': {
                            parameter.currentValue = 15;
                            break;
                        }
                        case 'MaxRetries': {
                            parameter.currentValue = 5;
                            break;
                        }
                        case 'NewSocketLoopEnable': {
                            parameter.currentValue = true;
                            break;
                        }
                        case 'LowLatencyEnable': {
                            parameter.currentValue = true;
                            break;
                        }
                        case 'browserHWAccel': {
                            parameter.currentValue = false;
                            break;
                        }
                    }
                });
            });

            // Setting advanced settings
            osn.NodeObs.OBS_settings_saveSettings('Advanced', advancedSettings);

            // Checking if advanced settings were updated correctly
            const updatedAdvancedSettings = osn.NodeObs.OBS_settings_getSettings('Advanced');
            expect(advancedSettings).to.eql(updatedAdvancedSettings);
        });
    });

    context('# OBS_settings_getListCategories', function() {
        it('Get all settings categories', function() {
            // Getting categories list
            const categories = osn.NodeObs.OBS_settings_getListCategories();

            // Checking if categories list contains the basic settings categories
            expect(categories.length).to.not.equal(0);
            expect(categories).to.include.members(basicOBSSettingsCategories);
        });
    });
});