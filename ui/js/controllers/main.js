"use strict";

treeherderApp.controller('MainCtrl', [
    '$scope', '$rootScope', '$routeParams', '$location', 'ThLog',
    'ThRepositoryModel', 'thPinboard', 'thNotify', '$modal',
    'thClassificationTypes', 'thEvents', '$interval', '$window',
    'ThExclusionProfileModel', 'thJobFilters', 'ThResultSetStore',
    'thDefaultRepo', 'thJobNavSelectors',
    function MainController(
        $scope, $rootScope, $routeParams, $location, ThLog,
        ThRepositoryModel, thPinboard, thNotify, $modal,
        thClassificationTypes, thEvents, $interval, $window,
        ThExclusionProfileModel, thJobFilters, ThResultSetStore,
        thDefaultRepo, thJobNavSelectors) {

        var $log = new ThLog("MainCtrl");

        // Query String param for selected job
        var QS_SELECTED_JOB = "selectedJob";

        thClassificationTypes.load();

        $rootScope.getWindowTitle = function() {
            var ufc = $scope.getUnclassifiedFailureCount($rootScope.repoName);
            return "[" + ufc + "] " + $rootScope.repoName;
        };

        $rootScope.$on(thEvents.jobClick, function(ev, job) {
            $location.search(QS_SELECTED_JOB, job.id);
        });

        $rootScope.$on(thEvents.clearSelectedJob, function() {
            $location.search(QS_SELECTED_JOB, null);
        });

        $rootScope.closeJob = function() {
            // Setting the selectedJob to null closes the bottom panel
            $rootScope.selectedJob = null;

            // Clear the selected job display style
            $rootScope.$emit(thEvents.clearSelectedJob, $rootScope.selectedJob);

            // Reset selected job to null to initialize nav position
            ThResultSetStore.setSelectedJob($rootScope.repoName);
        };

        // Clear the job if it occurs in a particular area
        $scope.clearJobOnClick = function(event) {
            var element = event.target;
            // Suppress for various UI elements so selection is preserved
            var ignoreClear = element.hasAttribute("ignore-job-clear-on-click");

            if (!ignoreClear && !thPinboard.hasPinnedJobs()) {
                $scope.closeJob();
            }
        };

        // Single key shortcuts to allow in ui events (usually inputs)
        var mousetrapExclusions = [
            'i',     // Toggle display in-progress jobs (pending/running)
            'right', // Select next job
            'left',  // Select previous job
            'j',     // Select next unclassified failure
            'n',     // Select next unclassified failure
            'k',     // Select previous unclassified failure
            'p',     // Select previous unclassified failure
            'r',     // Retrigger selected job
            'space', // Pin selected job to pinboard
            'u',     // Display only unclassified failures
            'b',     // Pin selected job and add related bug
            'c',     // Pin selected job and add classification
            'f',     // Enter a quick filter
            'l',     // Open the logviewer for the selected job
            '?'      // Display onscreen keyboard shortcuts
        ];

        // Make the single key exclusions available
        $scope.allowKeys = function() {
            Mousetrap.unbind(mousetrapExclusions);
        };

        /* Unique settings for the classification dropdown to allow 'c'
         * and 'b' and invoke those shortcuts while focused. Since we
         * conveniently don't have those classification Names at present */
        $scope.allowKeysClassificationDropdown = function() {
            Mousetrap.unbind(_.without(mousetrapExclusions, 'c', 'b'));
        };

        // Process shortcut events
        $scope.processKeyboardInput = function(ev) {

            /* If the user is in an editable element or pressing shift
             * then disable keyboard events, unless otherwise enabled
             * in inputs by the 'mousetrap' class in markup */
            var activeElement = document.activeElement;
            if (activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'SELECT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable || ev.keyCode === 16) {
                return;
            }

            /* In some cases we need to handle the digest cycle otherwise
             * we will see interaction delays. Where needed we use $scope.$evalAsync
             * for optimization but may use $timeout or $digest if required */

            // Shortcut: toggle display in-progress jobs (pending/running)
            Mousetrap.bind('i', function() {
                $scope.$evalAsync($scope.toggleInProgress());
            });

            // Shortcut: select previous job
            Mousetrap.bind('left', function() {
                $rootScope.$emit(thEvents.changeSelection,
                                 'previous',
                                 thJobNavSelectors.ALL_JOBS);
            });

            // Shortcut: select next job
            Mousetrap.bind('right', function() {
                $rootScope.$emit(thEvents.changeSelection,
                                 'next',
                                 thJobNavSelectors.ALL_JOBS);
            });

            // Shortcut: select next unclassified failure
            Mousetrap.bind(['j', 'n'], function() {
                $rootScope.$emit(thEvents.changeSelection,
                                 'next',
                                 thJobNavSelectors.UNCLASSIFIED_FAILURES);
            });

            // Shortcut: select previous unclassified failure
            Mousetrap.bind(['k', 'p'], function() {
                $rootScope.$emit(thEvents.changeSelection,
                                 'previous',
                                 thJobNavSelectors.UNCLASSIFIED_FAILURES);
            });

            // Shortcut: retrigger selected job
            Mousetrap.bind('r', function() {
                if ($scope.selectedJob) {
                    $scope.$evalAsync(
                        $rootScope.$emit(thEvents.jobRetrigger,
                                         $rootScope.selectedJob)
                    );
                }
            });

            // Shortcut: pin selected job to pinboard
            Mousetrap.bind('space', function(ev) {
                // If a job is selected add it otherwise
                // let the browser handle the spacebar
                if ($scope.selectedJob) {
                    // Prevent page down propagating to the jobs panel
                    ev.preventDefault();

                    $scope.$evalAsync(
                        $rootScope.$emit(thEvents.jobPin, $rootScope.selectedJob)
                    );
                }
            });

            // Shortcut: display only unclassified failures
            Mousetrap.bind('u', function() {
                $scope.$evalAsync($scope.toggleUnclassifiedFailures);
            });

            // Shortcut: pin selected job to pinboard and add a related bug
            Mousetrap.bind('b', function(ev) {
                if ($scope.selectedJob) {
                    $rootScope.$emit(thEvents.addRelatedBug,
                                     $rootScope.selectedJob);

                    // Prevent shortcut key overflow during focus
                    ev.preventDefault();

                    $scope.$evalAsync(
                        $rootScope.$broadcast('focus-this', "related-bug-input")
                    );

                    /* Treat single key shortcuts as regular text during input.
                     * This prevents invocation of single key hotkeys like 'c'
                     * during bug number entry, which would cross focus the
                     * comments field. We validate numbers via the markup. */
                    $scope.$evalAsync($scope.allowKeys());
                }
            });

            // Shortcut: pin selected job to pinboard and enter classification
            Mousetrap.bind('c', function(ev) {
                if ($scope.selectedJob) {
                    $scope.$evalAsync(
                        $rootScope.$emit(thEvents.jobPin, $rootScope.selectedJob)
                    );

                    // Prevent shortcut key overflow during focus
                    ev.preventDefault();

                    $scope.$evalAsync(
                        $rootScope.$broadcast('focus-this', "classification-comment")
                    );

                    // Treat single key shortcuts as regular text during input
                    $scope.$evalAsync($scope.allowKeys());
                }
            });

            // Shortcut: enter a quick filter
            Mousetrap.bind('f', function(ev) {
                // Prevent shortcut key overflow during focus
                ev.preventDefault();

                $('#quick-filter').focus();
            });

            // Shortcut: clear the quick filter field
            Mousetrap.bind('ctrl+shift+f', function(ev) {
                // Prevent shortcut key overflow during focus
                ev.preventDefault();

                $scope.$evalAsync($scope.clearFilterBox());
            });

            // Shortcut: escape closes any open panels and clears selected job
            Mousetrap.bind('escape', function() {
                $scope.$evalAsync($scope.setFilterPanelShowing(false));
                $scope.$evalAsync($scope.setSettingsPanelShowing(false));
                $scope.$evalAsync($scope.setSheriffPanelShowing(false));
                $scope.$evalAsync($scope.closeJob());
                $scope.$evalAsync($scope.setOnscreenShortcutsShowing(false));
            });

            // Shortcut: clear the pinboard
            Mousetrap.bind('ctrl+shift+u', function() {
                $scope.$evalAsync($rootScope.$emit(thEvents.clearPinboard));
            });

            // Shortcut: save pinboard classification and related bugs
            Mousetrap.bind('ctrl+enter', function() {
                $scope.$evalAsync($rootScope.$emit(thEvents.saveClassification));
            });

            // Shortcut: open the logviewer for the selected job
            Mousetrap.bind('l', function() {
                if ($scope.selectedJob) {
                    $scope.$evalAsync($rootScope.$emit(thEvents.openLogviewer));
                }
            });

            // Shortcut: delete classification and related bugs
            Mousetrap.bind('ctrl+backspace', function() {
                if ($scope.selectedJob) {
                    $scope.$evalAsync($rootScope.$emit(thEvents.deleteClassification));
                }
            });

            // Shortcut: display onscreen keyboard shortcuts
            Mousetrap.bind('?', function() {
                $scope.$evalAsync($scope.setOnscreenShortcutsShowing(true));
            });

        };

        $scope.repoModel = ThRepositoryModel;

        $scope.getTopNavBarHeight = function() {
            return $("#th-global-top-nav-panel").find("#top-nav-main-panel").height();
        };

        // adjust the body padding so we can see all the job/resultset data
        // if the top navbar height has changed due to window width changes
        // or adding enough watched repos to wrap.
        $rootScope.$watch($scope.getTopNavBarHeight, function(newValue) {
            $("body").css("padding-top", newValue);
        });

        /**
         * The watched repos in the nav bar can be either on the left or the
         * right side of the screen and the drop-down menu may get cut off
         * if it pulls right while on the left side of the screen.
         * And it can change any time the user re-sizes the window, so we must
         * check this each time a drop-down is invoked.
         */
        $scope.setDropDownPull = function(event) {
            $log.debug("dropDown", event.target);
            var element = event.target.offsetParent;
            if (element.offsetLeft > $(window).width() / 2) {
                $(element).find(".dropdown-menu").addClass("pull-right");
            } else {
                $(element).find(".dropdown-menu").removeClass("pull-right");
            }

        };

        $scope.getUnclassifiedFailureCount = function(repoName) {
            return ThResultSetStore.getUnclassifiedFailureCount(repoName);
        };

        $scope.isSkippingExclusionProfiles = $location.search().exclusion_profile === 'false';

        $scope.toggleExcludedJobs = function() {
            if ($location.search().exclusion_profile === 'false') {
                $location.search('exclusion_profile', null);
            }else{
                $location.search('exclusion_profile', 'false');
            }
        };

        $scope.toggleUnclassifiedFailures = thJobFilters.toggleUnclassifiedFailures;
        $scope.toggleTier1Only = thJobFilters.toggleTier1Only;

        $scope.toggleInProgress = function() {
            thJobFilters.toggleInProgress();
        };

        $scope.allExpanded = function(cls) {
            var fullList = $("." + cls);
            var visibleList = $("." + cls + ":visible");
            return fullList.length === visibleList.length;
        };

        $scope.allCollapsed = function(cls) {
            var visibleList = $("." + cls + ":visible");
            return visibleList.length === 0;
        };

        $scope.toggleAllRevisions = function(collapse) {
            collapse = collapse || $scope.allCollapsed("revision-list");
            $rootScope.$emit(
                thEvents.toggleAllRevisions, collapse
            );

        };

        $scope.getGroupState = function() {
            return $location.search().group_state || "collapsed";
        };

        $scope.groupState = $scope.getGroupState();

        $scope.toggleGroupState = function() {
            var newGroupState = $scope.groupState === "collapsed" ? "expanded" : null;
            $location.search("group_state", newGroupState);
        };

        var getNewReloadTriggerParams = function() {
            return _.pick(
                $location.search(),
                ThResultSetStore.reloadOnChangeParameters
            );
        };

        $scope.setLocationSearchParam = function(param, value) {
            $location.search(param, value);
        };

        $scope.cachedReloadTriggerParams = getNewReloadTriggerParams();

        // reload the page if certain params were changed in the URL.  For
        // others, such as filtering, just re-filter without reload.

        // the param ``skipNextPageReload`` will cause a single run through
        // this code to skip the page reloading even on a param that would
        // otherwise trigger a page reload.  This is useful for a param that
        // is being changed by code in a specific situation as opposed to when
        // the user manually edits the URL location bar.
        $rootScope.$on('$locationChangeSuccess', function() {

            // used to test for display of watched-repo-navbar
            $rootScope.locationPath = $location.path().replace('/', '');

            // used to avoid bad urls when the app redirects internally
            $rootScope.urlBasePath = $location.absUrl().split('?')[0];

            var newReloadTriggerParams = getNewReloadTriggerParams();
            // if we are just setting the repo to the default because none was
            // set initially, then don't reload the page.
            var defaulting = newReloadTriggerParams.repo === thDefaultRepo &&
                             !$scope.cachedReloadTriggerParams.repo;

            if (!defaulting && $scope.cachedReloadTriggerParams &&
                !_.isEqual(newReloadTriggerParams, $scope.cachedReloadTriggerParams) &&
                !$rootScope.skipNextPageReload) {

                $window.location.reload();
            } else {
                $scope.cachedReloadTriggerParams = newReloadTriggerParams;
            }
            $rootScope.skipNextPageReload = false;

            // handle a change in the groupState whether it was by the button
            // or directly in the url.
            var newGroupState = $scope.getGroupState();
            if (newGroupState !== $scope.groupState) {
                $scope.groupState = newGroupState;
                $rootScope.$emit(thEvents.groupStateChanged);
            }
        });

        $scope.changeRepo = function(repo_name) {
            //clear all filter params and revisions...
            $location.search({"repo": repo_name});
        };

        $scope.clearFilterBox = function() {
            thJobFilters.removeFilter("searchStr");
            $("#quick-filter").val("").focus();
        };

        $scope.onscreenOverlayShowing = false;

        $scope.onscreenShortcutsShowing = false;
        $scope.setOnscreenShortcutsShowing = function(tf) {
            $scope.onscreenShortcutsShowing = tf;
            $scope.onscreenOverlayShowing = tf;
        };

        $scope.isFilterPanelShowing = false;
        $scope.setFilterPanelShowing = function(tf) {
            $scope.isFilterPanelShowing = tf;
        };

        $scope.isSettingsPanelShowing = false;
        $scope.setSettingsPanelShowing = function(tf) {
            $scope.isSettingsPanelShowing = tf;
        };

        $scope.isSheriffPanelShowing = false;
        $scope.setSheriffPanelShowing = function(tf) {
            if (tf) {
                // lazy fetching of exclusion profiles, because we don't
                // need them unless you're editing them on this page
                $rootScope.$emit(thEvents.initSheriffPanel);
            }
            $scope.isSheriffPanelShowing = tf;
        };

        $scope.pinboardCount = thPinboard.count;
        $scope.pinnedJobs = thPinboard.pinnedJobs;

        $scope.fileBug = function(event) {
            var target = event.target;
            // Click target is sometimes the icon in the button, not the button
            if(target.tagName.toLowerCase() == "i" && target.className.search("fa-bug") >= 0) {
                target = target.parentNode;
            }
            var summary = target.nextElementSibling.textContent;
            var modalInstance = $modal.open({
                templateUrl: 'partials/main/intermittent.html',
                controller: 'IntermittentFilerCtrl',
                size: 'lg',
                resolve: {
                    summary: function() {
                        return summary;
                    },
                    fullLog: function() {
                        return $('.raw-log-icon')[0].href;
                    },
                    parsedLog: function() {
                        return $('#logviewer-btn')[0].href;
                    },
                    reftest: function() {
                        return $scope.selectedJob.job_group_name.search("Reftest") >= 0 ?
                            $('#reftestviewer-btn')[0].href : "";
                    },
                    selectedJob: function() {
                        return $scope.selectedJob;
                    }
                }
            });
            
            modalInstance.opened.then(function () {
                window.setTimeout(function () { modalInstance.initiate(); }, 0);
            });
        };
    }
]);

treeherderApp.controller('IntermittentFilerCtrl', function($scope, $modalInstance, $http, summary, 
                                                           fullLog, parsedLog, reftest, selectedJob) {
    /**
     *  Pre-fill the form with information/metadata from the failure
     */
    $scope.initiate = function() {
        var parsedSummary = $modalInstance.parseSummary(summary);

        console.log(parsedSummary, fullLog, parsedLog, reftest, selectedJob);

        document.getElementById("modalSummary").value = "Intermittent " + parsedSummary[0].join(" | ");

        document.getElementById("modalParsedLog").nextElementSibling.href = parsedLog;
        document.getElementById("modalFullLog").nextElementSibling.href = fullLog;
        document.getElementById("modalReftestLog").nextElementSibling.href = reftest;

        // Only show the reftest viewer link if this is a reftest
        if(reftest == "") {
            document.getElementById("modalReftestLogLabel").className = "hidden";
            document.getElementById("modalReftestLog").removeAttribute("checked");
        } else {
            document.getElementById("modalReftestLogLabel").className = "";
            document.getElementById("modalReftestLog").setAttribute("checked", true);
        }
    };
    
    $modalInstance.initiate = $scope.initiate;

    $modalInstance.possibleFilename;

    /*
     *  Remove extraneous junk from the start of the summary line
     *  and try to find the failing test name from what's left
     */
    $modalInstance.parseSummary = function(summary) {
        var omittedLeads = ["TEST-UNEXPECTED-FAIL", "PROCESS-CRASH"];
        summary = summary.split(" | ");

        for(var i=0; i < omittedLeads.length; i++) {
            if(summary[0].search(omittedLeads[i]) >= 0) {
                summary.shift();
            }
        }

        $modalInstance.possibleFilename = summary[0].split("/").pop();

        return [summary, $modalInstance.possibleFilename];
    };

    /*
     *  Attempt to find a good product/component for this failure
     */
    $scope.findProduct = function() {
        console.log($modalInstance.possibleFilename);
    };

    /*
     *  Same as clicking outside of the modal, but with a nice button-clicking feel...
     */
    $scope.cancelFiler = function() {
        $modalInstance.dismiss('cancel');
    };

    /*
     *  Actually send the gathered information to bugzilla.
     */
    $scope.submitFiler = function() {
        var bugstring = "https://bugzilla.mozilla.org/enter_bug.cgi?product=Core";
        var summarystring = "&short_desc=" + encodeURIComponent(document.getElementById("modalSummary").value);

        var logstrings = "";
        var logcheckboxes = document.getElementById("modalLogLinkCheckboxes").getElementsByTagName("input");

        for(var i=0;i<logcheckboxes.length;i++) {
            if(logcheckboxes[i].checked) {
                logstrings += logcheckboxes[i].nextElementSibling.href + "\n\n";
            }
        }

        var commentstring = "&comment=" + encodeURIComponent(logstrings + document.getElementById("modalComment").value);

        var keywordsstring = "&keywords=" + encodeURIComponent(document.getElementById("modalKeywords").value);
        var ccstring = "&cc=" + encodeURIComponent(document.getElementById("modalCc").value);

        var dependsstring = "&dependson=" + encodeURIComponent(document.getElementById("modalDepends").value);
        var blocksstring = "&blocked=" + encodeURIComponent(document.getElementById("modalBlocks").value);

        // We'll submit with credentials eventually, but this is easier to debug
alert("This defaults to the 'Core' product for now, careful if you actually use this thing for real.");
        window.open(bugstring + summarystring + commentstring + keywordsstring + ccstring + dependsstring + blocksstring);
    };
});

