#!/bin/bash
DIR="$(cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
cd "$DIR"

# Ensure bun is in PATH
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

while getopts "p:f:l" OPTION 2> /dev/null; do
    case ${OPTION} in
        l)
            DO_LOOP="yes"
            ;;
        \?)
            break
            ;;
    esac
done

LOOPS=0

set +e

if [ "$DO_LOOP" == "yes" ]; then
    while true; do
        if [ ${LOOPS} -gt 0 ]; then
            echo "Restarted $LOOPS times"
        fi
        CONSOLA_LEVEL=-1 bun run start $@

        echo "To escape the loop, press CTRL+C now. Otherwise, wait 5 seconds for the server to restart."
        echo ""
        sleep 5
        ((LOOPS++))
    done
else
    CONSOLA_LEVEL=-1 bun run start $@
fi

# https://github.com/pmmp/PocketMine-MP/blob/master/start.sh I've got the restart script from this link. I modded it to work for this project. ~HBIDamian
